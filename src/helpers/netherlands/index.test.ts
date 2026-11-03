import { isInNetherlands } from './index';

describe('isInNetherlands', () => {
  it.each([
    ['Amsterdam', 4.9041, 52.3676],
    ['Rotterdam', 4.4777, 51.9244],
    ['Groningen', 6.5665, 53.2194],
    ['Maastricht', 5.6909, 50.8514],
    ['Enschede', 6.8937, 52.2215],
  ])('returns true for %s', (_name, lng, lat) => {
    expect(isInNetherlands(lng, lat)).toBe(true);
  });

  it.each([
    ['Antwerpen', 4.4025, 51.2194],
    ['Aken', 6.0839, 50.7753],
    ['Düsseldorf', 6.7735, 51.2277],
    ['Gent', 3.7174, 51.0543],
    ['Emmerich (bbox, outside NL)', 6.2453, 51.8333],
  ])('returns false for %s', (_name, lng, lat) => {
    expect(isInNetherlands(lng, lat)).toBe(false);
  });

  it('returns false for invalid coordinates', () => {
    expect(isInNetherlands(NaN, 52)).toBe(false);
    expect(isInNetherlands(undefined as unknown as number, 52)).toBe(false);
  });
});
