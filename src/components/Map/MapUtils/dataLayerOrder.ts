import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_POLICY_HUBS,
  DATA_LAYER_ORDER_GROUP,
  DATA_LAYER_ORDER_CBS,
  DATA_LAYER_ORDER_SERVICE_AREAS,
  DATA_LAYER_ORDER_HUBS,
  DATA_LAYER_ORDER_VERBODSGEBIEDEN,
  DEFAULT_DATA_LAYER_ORDER,
  sanitizeDataLayerOrder
} from '../../../reducers/layers.js';
import { canMutateMapLayers, whenMapLayersMutable } from './mapGuards';

const CBS_MAP_LAYER_IDS = [
  'zones-geodata',
  'zones-geodata-border'
];

const PARK_GROUP_MAP_LAYER_IDS = [
  'vehicles-point',
  'vehicles-clusters',
  'vehicles-clusters-count',
  'vehicles-clusters-point',
  'vehicles-heatmap'
];

const RENTALS_GROUP_MAP_LAYER_IDS = [
  'rentals-origins-point',
  'rentals-origins-clusters',
  'rentals-origins-clusters-count',
  'rentals-origins-clusters-point',
  'rentals-origins-heatmap',
  'rentals-destinations-point',
  'rentals-destinations-clusters',
  'rentals-destinations-clusters-count',
  'rentals-destinations-clusters-point',
  'rentals-destinations-heatmap',
  'h3-hexes-layer-fill',
  'h3-hexes-layer-border',
  'h3-hexes-layer',
  'h3-hex-areas-layer',
  'h3-hexes-percentageValues-layer'
];

const SERVICE_AREAS_MAP_LAYER_IDS = [
  'service_areas-layer-fill',
  'service_areas-layer-border',
  'service_area_delta-layer-fill',
  'service_area_delta-layer-border'
];

// On /map/beleidshubs hubs + verbodsgebieden share one source/layer set
const POLICY_HUBS_NATIVE_MAP_LAYER_IDS = [
  'policy_hubs-layer-fill',
  'policy_hubs-layer-border',
  'policy_hubs-hub-logo'
];

const HUBS_OVERLAY_MAP_LAYER_IDS = [
  'overlay-hubs-layer-fill',
  'overlay-hubs-layer-border',
  'overlay-hubs-hub-logo'
];

const VERBODSGEBIEDEN_OVERLAY_MAP_LAYER_IDS = [
  'overlay-verbodsgebieden-layer-fill',
  'overlay-verbodsgebieden-layer-border',
  'overlay-verbodsgebieden-hub-logo'
];

interface MapLike {
  getLayer?: (id: string) => unknown;
  moveLayer?: (id: string) => void;
}

const getMapLayerIdsForListItem = (listId: string, displayMode: string): string[] => {
  if (listId === DATA_LAYER_ORDER_CBS) {
    return CBS_MAP_LAYER_IDS;
  }
  if (listId === DATA_LAYER_ORDER_GROUP) {
    if (displayMode === DISPLAYMODE_PARK) {
      return PARK_GROUP_MAP_LAYER_IDS;
    }
    if (displayMode === DISPLAYMODE_RENTALS) {
      return RENTALS_GROUP_MAP_LAYER_IDS;
    }
  }
  if (listId === DATA_LAYER_ORDER_SERVICE_AREAS) {
    return SERVICE_AREAS_MAP_LAYER_IDS;
  }
  if (listId === DATA_LAYER_ORDER_HUBS) {
    return displayMode === DISPLAYMODE_POLICY_HUBS
      ? POLICY_HUBS_NATIVE_MAP_LAYER_IDS
      : HUBS_OVERLAY_MAP_LAYER_IDS;
  }
  if (listId === DATA_LAYER_ORDER_VERBODSGEBIEDEN) {
    return displayMode === DISPLAYMODE_POLICY_HUBS
      ? POLICY_HUBS_NATIVE_MAP_LAYER_IDS
      : VERBODSGEBIEDEN_OVERLAY_MAP_LAYER_IDS;
  }
  return [];
};

const moveExistingLayersToTop = (map: MapLike, layerIds: string[]) => {
  if (!map.getLayer || !map.moveLayer) return;

  layerIds.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId);
      }
    } catch {
      // Layer may have been removed during a style change or unmount.
    }
  });
};

/**
 * Apply the user-defined data-layer order to the MapLibre stack.
 * `order` is top-first: the first list item is drawn on top of later items.
 */
export const applyDataLayerOrder = (
  map: unknown,
  order: string[] | undefined,
  displayMode: string
): void => {
  if (!map || !canMutateMapLayers(map)) return;
  if (!DEFAULT_DATA_LAYER_ORDER[displayMode]) {
    return;
  }

  const sanitized = sanitizeDataLayerOrder({
    [displayMode]: order || DEFAULT_DATA_LAYER_ORDER[displayMode]
  });
  const topFirst = sanitized[displayMode] || DEFAULT_DATA_LAYER_ORDER[displayMode];

  // Move bottom items first so the first list item ends up on top.
  [...topFirst].reverse().forEach((listId) => {
    moveExistingLayersToTop(map as MapLike, getMapLayerIdsForListItem(listId, displayMode));
  });
};

/**
 * Apply order once the map style is mutable. Used after async HB layer adds.
 */
export const applyDataLayerOrderWhenReady = (
  map: unknown,
  order: string[] | undefined,
  displayMode: string
): void => {
  whenMapLayersMutable(map, () => {
    applyDataLayerOrder(map, order, displayMode);
  });
};
