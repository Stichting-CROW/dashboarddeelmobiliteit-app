import { isHubOfType } from './common';

const virtualHub = { geography_type: 'stop', stop: { is_virtual: true } };
const physicalHub = { geography_type: 'stop', stop: { is_virtual: false } };
const hubWithoutStop = { geography_type: 'stop' };
const noParkingZone = { geography_type: 'no_parking' };

describe('isHubOfType', () => {
  it('matches every hub for "all"', () => {
    expect(isHubOfType(virtualHub, 'all')).toBe(true);
    expect(isHubOfType(physicalHub, 'all')).toBe(true);
    expect(isHubOfType(hubWithoutStop, undefined)).toBe(true);
  });

  it('only matches virtual hubs for "virtual"', () => {
    expect(isHubOfType(virtualHub, 'virtual')).toBe(true);
    expect(isHubOfType(physicalHub, 'virtual')).toBe(false);
    expect(isHubOfType(hubWithoutStop, 'virtual')).toBe(false);
  });

  it('treats hubs without is_virtual as physical', () => {
    expect(isHubOfType(physicalHub, 'physical')).toBe(true);
    expect(isHubOfType(hubWithoutStop, 'physical')).toBe(true);
    expect(isHubOfType(virtualHub, 'physical')).toBe(false);
  });

  it('never filters out zones that are not hubs', () => {
    expect(isHubOfType(noParkingZone, 'virtual')).toBe(true);
    expect(isHubOfType(noParkingZone, 'physical')).toBe(true);
  });
});
