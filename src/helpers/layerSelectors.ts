import { StateType } from '../types/StateType';
import {
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
  DEFAULT_DATA_LAYER_ORDER,
  sanitizeActiveDataLayers,
  sanitizeDataLayerOrder,
  sanitizeOverlayLayers
} from '../reducers/layers.js';

/**
 * Default active data layers configuration
 */
export const DEFAULT_ACTIVE_DATA_LAYERS = {
  'displaymode-park': [DISPLAYMODE_PARKEERDATA_VOERTUIGEN],
  'displaymode-rentals': [DISPLAYMODE_VERHUURDATA_VOERTUIGEN]
};

/**
 * Selector to get active data layers from Redux state
 * @param state - The Redux state
 * @returns The active data layers object or default configuration
 */
export const selectActiveDataLayers = (state: StateType) => {
  const raw = state.layers?.active_data_layers || DEFAULT_ACTIVE_DATA_LAYERS;
  return sanitizeActiveDataLayers(raw);
};

/**
 * Check if a park layer is currently active
 * @param activeDataLayers - The active data layers object
 * @param layerName - The layer name to check
 * @returns True if the layer is active, false otherwise
 */
export const isParkLayerActive = (activeDataLayers: any, layerName: string): boolean => {
  if (!activeDataLayers || typeof activeDataLayers !== 'object') {
    return false;
  }
  const parkLayers = activeDataLayers['displaymode-park'] || [];
  return Array.isArray(parkLayers) && parkLayers.includes(layerName);
};

/**
 * Check if a rentals layer is currently active
 * @param activeDataLayers - The active data layers object
 * @param layerName - The layer name to check
 * @returns True if the layer is active, false otherwise
 */
export const isRentalsLayerActive = (activeDataLayers: any, layerName: string): boolean => {
  if (!activeDataLayers || typeof activeDataLayers !== 'object') {
    return false;
  }
  const rentalsLayers = activeDataLayers['displaymode-rentals'] || [];
  return Array.isArray(rentalsLayers) && rentalsLayers.includes(layerName);
};

/**
 * Selector to get the data-layer z-order from Redux state (top-first).
 */
export const selectDataLayerOrder = (state: StateType) => {
  const raw = state.layers?.data_layer_order || DEFAULT_DATA_LAYER_ORDER;
  return sanitizeDataLayerOrder(raw);
};

/**
 * Selector for the toggleable overlay layers (servicegebieden/hubs/verbodsgebieden).
 */
export const selectOverlayLayers = (state: StateType) => {
  return sanitizeOverlayLayers(state.layers?.overlay_layers);
};

/**
 * Check if an overlay layer is enabled for a display mode.
 */
export const isOverlayLayerEnabled = (
  overlayLayers: { enabled: { [displayMode: string]: string[] } },
  displayMode: string,
  layerId: string
): boolean => {
  const enabled = overlayLayers?.enabled?.[displayMode];
  return Array.isArray(enabled) && enabled.includes(layerId);
};