import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DATA_LAYER_ORDER_GROUP,
  DATA_LAYER_ORDER_CBS,
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
  if (displayMode !== DISPLAYMODE_PARK && displayMode !== DISPLAYMODE_RENTALS) {
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
