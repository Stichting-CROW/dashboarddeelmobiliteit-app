import {
  createFilterparameters,
  getMunicipalityZoneIds,
  NL_COUNTRY_ZONE_ID,
} from './pollTools.js';
import { DISPLAYMODE_OTHER, DISPLAYMODE_PARK } from '../reducers/layers.js';

const filterAllePlaatsen = {
  gebied: '',
  zones: '',
  aanbiedersexclude: '',
  voertuigtypesexclude: '',
  datum: '',
  ontwikkelingvan: '2026-09-01',
  ontwikkelingtot: '2026-09-03',
};

const gebieden = [
  { gm_code: 'GM0310', name: 'De Bilt' },
  { gm_code: 'GM0344', name: 'Utrecht' },
  { gm_code: 'GM0312', name: 'Bunnik' },
];

const zones = [
  { zone_id: 1, municipality: 'GM0310', zone_type: 'municipality', name: 'De Bilt' },
  { zone_id: 2, municipality: 'GM0310', zone_type: 'residential_area', name: 'Bilthoven' },
  { zone_id: 3, municipality: 'GM0344', zone_type: 'municipality', name: 'Utrecht' },
  { zone_id: 4, municipality: 'GM0312', zone_type: 'municipality', name: 'Bunnik' },
  { zone_id: 5, municipality: 'GM0312', zone_type: 'custom', name: 'Hub' },
  { zone_id: 9, municipality: 'GM0999', zone_type: 'municipality', name: 'Elsewhere' },
];

const aanbieders = [{ system_id: 'moveyou' }, { system_id: 'hely' }];

const buildMetadata = (overrides = {}) => ({
  gebieden,
  zones,
  aanbieders,
  aclOperators: [],
  vehicle_types: [],
  is_admin: false,
  ...overrides,
});

const zoneParam = (params) => params.find((p) => p.startsWith('zone_ids='));

const AGGREGATED = { is_logged_in: true, is_aggregated_stats: true };

describe('createFilterparameters zone scoping', () => {
  describe('aggregated stats, "Alle plaatsen"', () => {
    it('sends the NL country zone for admin accounts', () => {
      const params = createFilterparameters(
        DISPLAYMODE_OTHER, filterAllePlaatsen, buildMetadata({ is_admin: true }), AGGREGATED,
      );
      expect(zoneParam(params)).toBe(`zone_ids=${NL_COUNTRY_ZONE_ID}`);
    });

    it('sends only the municipality zones of accessible gebieden for other accounts', () => {
      const params = createFilterparameters(
        DISPLAYMODE_OTHER, filterAllePlaatsen, buildMetadata(), AGGREGATED,
      );
      expect(zoneParam(params)).toBe('zone_ids=1,3,4');
    });

    it('omits zone_ids while zones have not loaded yet', () => {
      const params = createFilterparameters(
        DISPLAYMODE_OTHER, filterAllePlaatsen, buildMetadata({ zones: [] }), AGGREGATED,
      );
      expect(zoneParam(params)).toBeUndefined();
    });
  });

  describe('point endpoints, "Alle plaatsen"', () => {
    it('keeps sending no zone_ids for logged-in map callers', () => {
      const params = createFilterparameters(
        DISPLAYMODE_PARK, filterAllePlaatsen, buildMetadata({ is_admin: true }), { is_logged_in: true },
      );
      expect(zoneParam(params)).toBeUndefined();
    });

    it('keeps sending no zone_ids with show_global', () => {
      const params = createFilterparameters(
        DISPLAYMODE_PARK, filterAllePlaatsen, buildMetadata({ is_admin: true }),
        { is_logged_in: true, show_global: true },
      );
      expect(zoneParam(params)).toBeUndefined();
    });

    it('still enumerates municipality zones for guests with public gebieden', () => {
      const params = createFilterparameters(
        DISPLAYMODE_PARK, filterAllePlaatsen, buildMetadata(), { is_logged_in: false },
      );
      expect(zoneParam(params)).toBe('zone_ids=1,3,4');
    });
  });

  describe('explicit selections take precedence', () => {
    it('uses the selected plaats zone', () => {
      const params = createFilterparameters(
        DISPLAYMODE_OTHER, { ...filterAllePlaatsen, gebied: 'GM0310' },
        buildMetadata({ is_admin: true }), AGGREGATED,
      );
      expect(zoneParam(params)).toBe('zone_ids=1');
    });

    it('uses explicitly selected zones', () => {
      const params = createFilterparameters(
        DISPLAYMODE_OTHER, { ...filterAllePlaatsen, zones: '5' },
        buildMetadata({ is_admin: true }), AGGREGATED,
      );
      expect(zoneParam(params)).toBe('zone_ids=5');
    });
  });

  it('tolerates an undefined datum for parking data', () => {
    const { datum, ...withoutDatum } = filterAllePlaatsen;
    expect(() => createFilterparameters(
      DISPLAYMODE_PARK, withoutDatum, buildMetadata(), { is_logged_in: true },
    )).not.toThrow();
  });
});

describe('getMunicipalityZoneIds', () => {
  it('returns unique municipality zone ids for the given gm_codes', () => {
    const duplicated = [...zones, zones[0]];
    expect(getMunicipalityZoneIds(duplicated, ['GM0310', 'GM0344'])).toEqual([1, 3]);
  });

  it('returns all municipality zones when no gm_codes are given', () => {
    expect(getMunicipalityZoneIds(zones)).toEqual([1, 3, 4, 9]);
  });

  it('handles missing zones', () => {
    expect(getMunicipalityZoneIds(undefined, ['GM0310'])).toEqual([]);
  });
});
