import {
  mergeOwnAndPublicVehicles,
  shouldIncludePublicVehicles
} from './pollParkingData.js';
import { isNearRealtime } from './pollTools.js';

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
