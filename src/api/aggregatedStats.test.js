/**
 * Tests the zone batching + NL-country-zone fallback in getAggregatedStats.
 * dedupedFetch is mocked; modules are reset per test because the module keeps
 * a per-session "country zone rejected" flag.
 */

jest.mock('./dedupedFetch', () => ({ dedupedFetch: jest.fn() }));

const API = 'https://api.test';
const NL_ZONE = 51233;

const filter = {
  gebied: '',
  zones: '',
  aanbiedersexclude: '',
  voertuigtypesexclude: '',
  datum: '',
  ontwikkelingvan: '2026-09-01',
  ontwikkelingtot: '2026-09-03',
  ontwikkelingaggregatie: 'day',
  ontwikkelingaggregatie_tijd: '00:00:00',
};

const municipalityZones = (count) => Array.from({ length: count }, (_, i) => ({
  zone_id: 1000 + i,
  municipality: `GM${1000 + i}`,
  zone_type: 'municipality',
  name: `Gemeente ${i}`,
}));

const buildMetadata = ({ zoneCount, isAdmin }) => {
  const zones = municipalityZones(zoneCount);
  return {
    gebieden: zones.map((z) => ({ gm_code: z.municipality, name: z.name })),
    zones,
    aanbieders: [{ system_id: 'moveyou' }],
    aclOperators: [],
    vehicle_types: [],
    is_admin: isAdmin,
  };
};

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const legacyBody = (moveyou) => ({
  available_vehicles_aggregated_stats: {
    values: [{ start_interval: '2026-09-01', moveyou }],
  },
});

const zoneIdsOf = (url) => {
  const match = new URL(url).searchParams.get('zone_ids');
  return match ? match.split(',').map(Number) : null;
};

const loadModule = () => {
  jest.resetModules();
  process.env.REACT_APP_MAIN_API_URL = API;
  // eslint-disable-next-line global-require
  const { dedupedFetch } = require('./dedupedFetch');
  // eslint-disable-next-line global-require
  const { getAggregatedStats, MAX_ZONE_IDS_PER_REQUEST } = require('./aggregatedStats');
  return { dedupedFetch, getAggregatedStats, MAX_ZONE_IDS_PER_REQUEST };
};

const options = (metadata) => ({
  filter,
  metadata,
  aggregationLevel: 'day',
  aggregationTime: '00:00:00',
});

describe('getAggregatedStats zone batching', () => {
  it('sends one request when zone_ids fit in a single batch', async () => {
    const { dedupedFetch, getAggregatedStats } = loadModule();
    dedupedFetch.mockResolvedValue(jsonResponse(legacyBody(7)));

    const result = await getAggregatedStats('tok', 'available_vehicles',
      options(buildMetadata({ zoneCount: 3, isAdmin: false })));

    expect(dedupedFetch).toHaveBeenCalledTimes(1);
    expect(zoneIdsOf(dedupedFetch.mock.calls[0][0])).toEqual([1000, 1001, 1002]);
    expect(result.available_vehicles_aggregated_stats.values[0].moveyou).toBe(7);
  });

  it('splits long zone lists into batches and sums the responses', async () => {
    const { dedupedFetch, getAggregatedStats, MAX_ZONE_IDS_PER_REQUEST } = loadModule();
    const zoneCount = MAX_ZONE_IDS_PER_REQUEST * 2 + 20;
    dedupedFetch.mockImplementation(async (url) => (
      jsonResponse(legacyBody(zoneIdsOf(url).length))
    ));

    const result = await getAggregatedStats('tok', 'available_vehicles',
      options(buildMetadata({ zoneCount, isAdmin: false })));

    expect(dedupedFetch).toHaveBeenCalledTimes(3);
    const batchSizes = dedupedFetch.mock.calls.map(([url]) => zoneIdsOf(url).length);
    expect(batchSizes).toEqual([MAX_ZONE_IDS_PER_REQUEST, MAX_ZONE_IDS_PER_REQUEST, 20]);
    // Each batch reported its own size, so the merged total is the zone count.
    expect(result.available_vehicles_aggregated_stats.values[0].moveyou).toBe(zoneCount);
  });

  it('requests without zone_ids when none are known yet', async () => {
    const { dedupedFetch, getAggregatedStats } = loadModule();
    dedupedFetch.mockResolvedValue(jsonResponse(legacyBody(1)));
    const metadata = { ...buildMetadata({ zoneCount: 3, isAdmin: false }), zones: [] };

    await getAggregatedStats('tok', 'available_vehicles', options(metadata));

    expect(dedupedFetch).toHaveBeenCalledTimes(1);
    expect(zoneIdsOf(dedupedFetch.mock.calls[0][0])).toBeNull();
  });
});

describe('getAggregatedStats NL country zone (admin, Alle plaatsen)', () => {
  it('uses the country zone when it returns data', async () => {
    const { dedupedFetch, getAggregatedStats } = loadModule();
    dedupedFetch.mockResolvedValue(jsonResponse(legacyBody(30)));

    const result = await getAggregatedStats('tok', 'available_vehicles',
      options(buildMetadata({ zoneCount: 3, isAdmin: true })));

    expect(dedupedFetch).toHaveBeenCalledTimes(1);
    expect(zoneIdsOf(dedupedFetch.mock.calls[0][0])).toEqual([NL_ZONE]);
    expect(result.available_vehicles_aggregated_stats.values[0].moveyou).toBe(30);
  });

  it('falls back to batched municipality zones when the country zone is empty', async () => {
    const { dedupedFetch, getAggregatedStats } = loadModule();
    dedupedFetch.mockImplementation(async (url) => {
      const ids = zoneIdsOf(url);
      if (ids.length === 1 && ids[0] === NL_ZONE) {
        return jsonResponse({ available_vehicles_aggregated_stats: { values: [] } });
      }
      return jsonResponse(legacyBody(ids.length));
    });

    const result = await getAggregatedStats('tok', 'available_vehicles',
      options(buildMetadata({ zoneCount: 3, isAdmin: true })));

    expect(dedupedFetch).toHaveBeenCalledTimes(2);
    expect(zoneIdsOf(dedupedFetch.mock.calls[1][0])).toEqual([1000, 1001, 1002]);
    expect(result.available_vehicles_aggregated_stats.values[0].moveyou).toBe(3);
  });

  it('stops trying the country zone for the session after a 403', async () => {
    const { dedupedFetch, getAggregatedStats } = loadModule();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    dedupedFetch.mockImplementation(async (url) => {
      const ids = zoneIdsOf(url);
      if (ids.length === 1 && ids[0] === NL_ZONE) {
        return jsonResponse({ message: 'You cannot consume this service' }, 403);
      }
      return jsonResponse(legacyBody(ids.length));
    });
    const opts = options(buildMetadata({ zoneCount: 3, isAdmin: true }));

    const first = await getAggregatedStats('tok', 'available_vehicles', opts);
    expect(dedupedFetch).toHaveBeenCalledTimes(2);
    expect(first.available_vehicles_aggregated_stats.values[0].moveyou).toBe(3);

    dedupedFetch.mockClear();
    await getAggregatedStats('tok', 'available_vehicles', opts);
    expect(dedupedFetch).toHaveBeenCalledTimes(1);
    expect(zoneIdsOf(dedupedFetch.mock.calls[0][0])).toEqual([1000, 1001, 1002]);

    warn.mockRestore();
  });
});
