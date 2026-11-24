import {
  mergeOwnAndPublicVehicles,
  shouldIncludePublicVehicles,
  buildVehicleFeatures,
  filterVehicleFeatures,
  didClientFilterChange
} from './pollParkingData.js';
import { isNearRealtime } from './pollTools.js';
import { UNKNOWN_DURATION_BIN } from '../components/Map/vehicle_marker.js';

const at = (latitude, longitude) => ({ location: { latitude, longitude } });

describe('mergeOwnAndPublicVehicles', () => {
  const own = [{ ...at(52.0907, 5.1214), system_id: 'check', bike_id: 'a' }];

  it('drops public vehicles that are also in the own data', () => {
    const publicVehicles = [{ ...at(52.0907, 5.1214), value: 'check' }];
    expect(mergeOwnAndPublicVehicles(own, publicVehicles)).toEqual(own);
  });

  it('drops public vehicles at a slightly different location', () => {
    const publicVehicles = [{ ...at(52.09075, 5.12145), value: 'check' }];
    expect(mergeOwnAndPublicVehicles(own, publicVehicles)).toEqual(own);
  });

  it('keeps public vehicles of another operator at the same spot', () => {
    const publicVehicles = [{ ...at(52.0907, 5.1214), value: 'felyx' }];
    expect(mergeOwnAndPublicVehicles(own, publicVehicles)).toHaveLength(2);
  });

  it('keeps public vehicles elsewhere in the Netherlands', () => {
    const publicVehicles = [{ ...at(52.3676, 4.9041), value: 'check' }];
    expect(mergeOwnAndPublicVehicles(own, publicVehicles)).toHaveLength(2);
  });
});

describe('shouldIncludePublicVehicles', () => {
  const state = (overrides = {}) => ({
    authentication: { user_data: { token: 'x', acl: {} } },
    metadata: { is_admin: false },
    filter: { show_all_nl_vehicles: true, datum: new Date().toISOString() },
    ...overrides
  });

  it('is true for logged-in users by default', () => {
    expect(shouldIncludePublicVehicles(state())).toBe(true);
  });

  it('is false when the user only wants their own data area', () => {
    expect(shouldIncludePublicVehicles(state({
      filter: { show_all_nl_vehicles: false, datum: new Date().toISOString() }
    }))).toBe(false);
  });

  it('is false for a date/time in the past', () => {
    const anHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(shouldIncludePublicVehicles(state({
      filter: { show_all_nl_vehicles: true, datum: anHourAgo }
    }))).toBe(false);
  });

  it('is false for NL-wide accounts', () => {
    expect(shouldIncludePublicVehicles(state({ metadata: { is_admin: true } }))).toBe(false);
  });

  it('is false for guests', () => {
    expect(shouldIncludePublicVehicles(state({ authentication: {} }))).toBe(false);
  });
});

describe('isNearRealtime', () => {
  const now = Date.parse('2026-11-05T14:00:00Z');

  it('accepts a datum within 10 minutes of now', () => {
    expect(isNearRealtime('2026-11-05T13:52:00Z', now)).toBe(true);
    expect(isNearRealtime('2026-11-05T14:05:00Z', now)).toBe(true);
  });

  it('rejects a datum further away', () => {
    expect(isNearRealtime('2026-11-05T13:45:00Z', now)).toBe(false);
    expect(isNearRealtime('2026-11-04T14:00:00Z', now)).toBe(false);
  });

  it('treats an unset datum as now', () => {
    expect(isNearRealtime(undefined, now)).toBe(true);
  });
});

describe('buildVehicleFeatures and filterVehicleFeatures', () => {
  const state = {
    authentication: { user_data: { token: 'x' } },
    metadata: {
      aanbieders: [
        { system_id: 'check', color: '#000' },
        { system_id: 'felyx', color: '#111' }
      ]
    },
    filter: {
      datum: '2026-11-05T14:00:00Z',
      aanbiedersexclude: '',
      parkeerduurexclude: '',
      non_operational_only: false
    }
  };

  const rawVehicles = [
    {
      ...at(52.09, 5.12),
      system_id: 'check',
      bike_id: 'a',
      start_time: '2026-11-05T10:00:00Z',
      is_own_data: true,
      is_non_operational: false
    },
    {
      ...at(52.37, 4.90),
      value: 'felyx',
      in_public_space_since: '2026-11-01T10:00:00Z',
      is_context: true,
      is_non_operational: false
    },
    {
      ...at(52.10, 5.13),
      system_id: 'check',
      bike_id: 'b',
      start_time: '2026-11-05T12:00:00Z',
      is_own_data: true,
      is_non_operational: true
    }
  ];

  it('builds features once with duration_bin and is_context', () => {
    const features = buildVehicleFeatures(state, rawVehicles);
    expect(features).toHaveLength(3);
    expect(features[0].properties.is_own_data).toBe(true);
    expect(features[0].properties.duration_bin).toBeDefined();
    expect(features[1].properties.is_context).toBe(true);
    expect(features[1].properties.system_id).toBe('felyx');
  });

  it('gives context vehicles without parked-since time the grey marker', () => {
    const features = buildVehicleFeatures(state, [
      ...rawVehicles,
      { ...at(52.37, 4.91), system_id: 'lime', is_context: true }
    ]);
    expect(features[3].properties.duration_bin).toBe(UNKNOWN_DURATION_BIN);
    expect(features[1].properties.duration_bin).not.toBe(UNKNOWN_DURATION_BIN);
    expect(features[0].properties.duration_bin).not.toBe(UNKNOWN_DURATION_BIN);
  });

  it('filters on operator without rebuilding duration_bin', () => {
    const features = buildVehicleFeatures(state, rawVehicles);
    const filtered = filterVehicleFeatures({
      ...state,
      filter: { ...state.filter, aanbiedersexclude: 'felyx' }
    }, features);

    expect(filtered.geoJson.features).toHaveLength(2);
    expect(filtered.geoJson.features.every(f => f.properties.system_id === 'check')).toBe(true);
    expect(filtered.operatorstats.check).toBe(2);
    expect(filtered.operatorstats.felyx).toBe(1);
  });

  it('filters on non-operational only', () => {
    const features = buildVehicleFeatures(state, rawVehicles);
    const filtered = filterVehicleFeatures({
      ...state,
      filter: { ...state.filter, non_operational_only: true }
    }, features);

    expect(filtered.geoJson.features).toHaveLength(1);
    expect(filtered.geoJson.features[0].properties.vehicle_id).toBe('b');
  });
});

describe('didClientFilterChange', () => {
  it('is true when no previous filter exists', () => {
    expect(didClientFilterChange({ aanbiedersexclude: '' }, null)).toBe(true);
  });

  it('is false when only unrelated fields changed', () => {
    const a = { aanbiedersexclude: '', parkeerduurexclude: '', non_operational_only: false, gebied: 'GM0344' };
    const b = { aanbiedersexclude: '', parkeerduurexclude: '', non_operational_only: false, gebied: 'GM0363' };
    expect(didClientFilterChange(a, b)).toBe(false);
  });

  it('is true when an operator exclude changed', () => {
    const a = { aanbiedersexclude: 'check', parkeerduurexclude: '', non_operational_only: false };
    const b = { aanbiedersexclude: '', parkeerduurexclude: '', non_operational_only: false };
    expect(didClientFilterChange(a, b)).toBe(true);
  });
});
