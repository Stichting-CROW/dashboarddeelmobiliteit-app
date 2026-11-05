import {
  sanitizeActiveDataLayers,
  DISPLAYMODE_PARK,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_VERHUURDATA_HB
} from './layers.js';

describe('sanitizeActiveDataLayers', () => {
  it('maps the removed Clusters park layer to Voertuigen', () => {
    const result = sanitizeActiveDataLayers({
      [DISPLAYMODE_PARK]: [DISPLAYMODE_PARKEERDATA_CLUSTERS],
      [DISPLAYMODE_RENTALS]: [DISPLAYMODE_VERHUURDATA_HB]
    });

    expect(result[DISPLAYMODE_PARK]).toEqual([DISPLAYMODE_PARKEERDATA_VOERTUIGEN]);
  });

  it('keeps a valid Heatmap park layer', () => {
    const result = sanitizeActiveDataLayers({
      [DISPLAYMODE_PARK]: [DISPLAYMODE_PARKEERDATA_HEATMAP],
      [DISPLAYMODE_RENTALS]: [DISPLAYMODE_VERHUURDATA_HB]
    });

    expect(result[DISPLAYMODE_PARK]).toEqual([DISPLAYMODE_PARKEERDATA_HEATMAP]);
  });

  it('falls back to Voertuigen when the park list is empty', () => {
    const result = sanitizeActiveDataLayers({
      [DISPLAYMODE_PARK]: [],
      [DISPLAYMODE_RENTALS]: [DISPLAYMODE_VERHUURDATA_HB]
    });

    expect(result[DISPLAYMODE_PARK]).toEqual([DISPLAYMODE_PARKEERDATA_VOERTUIGEN]);
  });
});
