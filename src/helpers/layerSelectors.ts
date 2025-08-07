import { StateType } from '../types/StateType';
import {
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN
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
  return state.layers?.active_data_layers || DEFAULT_ACTIVE_DATA_LAYERS;
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