import layers, {
  sanitizeActiveDataLayers,
  sanitizeOverlayLayers,
  HUB_TYPE_ALL,
  HUB_TYPE_VIRTUAL,
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

describe('overlay hub type', () => {
  it('defaults to all hubs when missing or invalid', () => {
    expect(sanitizeOverlayLayers(undefined).hub_type).toBe(HUB_TYPE_ALL);
    expect(sanitizeOverlayLayers({ hub_type: 'foo' }).hub_type).toBe(HUB_TYPE_ALL);
  });

  it('keeps a valid hub type', () => {
    expect(sanitizeOverlayLayers({ hub_type: HUB_TYPE_VIRTUAL }).hub_type).toBe(HUB_TYPE_VIRTUAL);
  });

  it('sets the hub type and ignores invalid values', () => {
    const state = layers(undefined, { type: 'LAYER_SET_OVERLAY_HUB_TYPE', payload: HUB_TYPE_VIRTUAL });
    expect(state.overlay_layers.hub_type).toBe(HUB_TYPE_VIRTUAL);

    const unchanged = layers(state, { type: 'LAYER_SET_OVERLAY_HUB_TYPE', payload: 'foo' });
    expect(unchanged).toBe(state);
  });
});
