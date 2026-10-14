/**
 * Data Layer Manager
 *
 * This module used to add/show/hide MapLibre layers directly. That responsibility
 * now lives in MapComponent (via activateLayers). This file now only validates
 * data-layer names and provides metadata used by the UI.
 */

// Available data layers grouped by display mode
const DATA_LAYERS = {
  'displaymode-park': {
    'parkeerdata-heatmap': {
      name: 'Heat Map',
      layerIds: ['vehicles-heatmap'],
      displayMode: 'displaymode-park'
    },
    'parkeerdata-clusters': {
      name: 'Clusters',
      layerIds: ['vehicles-clusters', 'vehicles-clusters-count', 'vehicles-clusters-point'],
      displayMode: 'displaymode-park'
    },
    'parkeerdata-voertuigen': {
      name: 'Voertuigen',
      layerIds: ['vehicles-point'],
      displayMode: 'displaymode-park'
    }
  },
  'displaymode-rentals': {
    'verhuurdata-hb': {
      name: 'HB',
      layerIds: ['rentals-origins-heatmap'],
      displayMode: 'displaymode-rentals'
    },
    'verhuurdata-heatmap': {
      name: 'Heat Map',
      layerIds: ['rentals-destinations-heatmap'],
      displayMode: 'displaymode-rentals'
    },
    'verhuurdata-clusters': {
      name: 'Clusters',
      layerIds: ['rentals-destinations-clusters', 'rentals-destinations-clusters-count', 'rentals-destinations-clusters-point'],
      displayMode: 'displaymode-rentals'
    },
    'verhuurdata-voertuigen': {
      name: 'Voertuigen',
      layerIds: ['rentals-destinations-point'],
      displayMode: 'displaymode-rentals'
    }
  }
};

/**
 * Get all available data layer options for a specific display mode
 */
export const getAvailableDataLayers = (displayMode) => {
  return DATA_LAYERS[displayMode] || {};
};

/**
 * Get all available data layers across all display modes
 */
export const getAllAvailableDataLayers = () => {
  return DATA_LAYERS;
};

const validateDataLayer = (layerName, displayMode, onError) => {
  if (!DATA_LAYERS[displayMode]?.[layerName]) {
    const error = `Unknown data layer: ${layerName} for display mode: ${displayMode}`;
    console.error(error);
    if (onError) onError(error);
    return false;
  }
  return true;
};

/**
 * Set a data layer as active.
 * The map is no longer touched here; MapComponent reacts to the Redux state.
 * The `map` parameter is kept for backward compatibility with existing callers.
 */
export const setDataLayer = (map, layerName, displayMode, onSuccess = null, onError = null) => {
  if (!validateDataLayer(layerName, displayMode, onError)) return;
  if (onSuccess) onSuccess(layerName);
};

/**
 * Unset a data layer.
 * The map is no longer touched here; MapComponent reacts to the Redux state.
 */
export const unsetDataLayer = (map, layerName, displayMode, onSuccess = null, onError = null) => {
  if (!validateDataLayer(layerName, displayMode, onError)) return;
  if (onSuccess) onSuccess(layerName);
};

/**
 * Toggle a data layer.
 * The map is no longer touched here; MapComponent reacts to the Redux state.
 */
export const toggleDataLayer = (map, layerName, displayMode, isVisible, onSuccess = null, onError = null) => {
  if (!validateDataLayer(layerName, displayMode, onError)) return;
  if (onSuccess) onSuccess(layerName);
};

/**
 * Set a single data layer as active (radio button behaviour).
 * The map is no longer touched here; MapComponent reacts to the Redux state.
 */
export const setSingleDataLayer = (map, layerName, displayMode, onSuccess = null, onError = null) => {
  if (!validateDataLayer(layerName, displayMode, onError)) return;
  if (onSuccess) onSuccess(layerName);
};

/**
 * Get the currently active data layers for a display mode.
 * This used to inspect the map; now it returns an empty array.
 * Consumers should read active_data_layers from Redux instead.
 */
export const getCurrentDataLayers = (map, displayMode) => {
  return [];
};
