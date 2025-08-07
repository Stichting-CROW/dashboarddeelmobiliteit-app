import { getMapStyles } from './map.js';
import { sources } from '../sources.js';
import { layers } from '../layers/index.js';

// Debug flag to control console.log messages
const DEBUG = false;

/**
 * Data Layer Manager
 * 
 * Provides a centralized system for managing data layers.
 * Handles adding layers if they don't exist, showing/hiding them,
 * and updating the Redux state. Multiple data layers can be active simultaneously.
 */

// Available data layers grouped by display mode
const DATA_LAYERS = {
  'displaymode-park': {
    'parkeerdata-heatmap': {
      name: 'Heat Map',
      layerId: 'vehicles-heatmap',
      sourceId: 'vehicles',
      displayMode: 'displaymode-park'
    },
    'parkeerdata-clusters': {
      name: 'Clusters',
      layerId: 'vehicles-clusters',
      sourceId: 'vehicles',
      displayMode: 'displaymode-park'
    },
    'parkeerdata-voertuigen': {
      name: 'Voertuigen',
      layerId: 'vehicles-point',
      sourceId: 'vehicles',
      displayMode: 'displaymode-park'
    }
  },
  'displaymode-rentals': {
    'verhuurdata-hb': {
      name: 'HB',
      layerId: 'rentals-origins-heatmap',
      sourceId: 'rentals-origins',
      displayMode: 'displaymode-rentals'
    },
    'verhuurdata-heatmap': {
      name: 'Heat Map',
      layerId: 'rentals-destinations-heatmap',
      sourceId: 'rentals-destinations',
      displayMode: 'displaymode-rentals'
    },
    'verhuurdata-clusters': {
      name: 'Clusters',
      layerId: 'rentals-destinations-clusters',
      sourceId: 'rentals-destinations',
      displayMode: 'displaymode-rentals'
    },
    'verhuurdata-voertuigen': {
      name: 'Voertuigen',
      layerId: 'rentals-destinations-point',
      sourceId: 'rentals-destinations',
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

/**
 * Check if a data layer exists on the map
 */
const layerExists = (map, layerId) => {
  if (!layerId) return false;
  return map.getLayer(layerId) !== undefined;
};

/**
 * Check if a source exists on the map
 */
const sourceExists = (map, sourceId) => {
  if (!sourceId) return false;
  return map.getSource(sourceId) !== undefined;
};

/**
 * Add a data layer and its source to the map
 */
const addDataLayerToMap = (map, layerName, displayMode) => {
  const layerConfig = DATA_LAYERS[displayMode]?.[layerName];
  if (!layerConfig) {
    console.warn(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    return false;
  }

  const { layerId, sourceId } = layerConfig;

  // Add source if it doesn't exist
  if (sourceId && !sourceExists(map, sourceId)) {
    const sourceConfig = sources[sourceId];
    if (sourceConfig) {
      map.addSource(sourceId, sourceConfig);
      if (DEBUG) console.log(`Added source: ${sourceId}`);
    } else {
      console.warn(`Source config not found for: ${sourceId}`);
      return false;
    }
  }

  // Add layer if it doesn't exist
  if (layerId && !layerExists(map, layerId)) {
    const layerConfig = layers[layerId];
    if (layerConfig) {
      // Ensure the layer has a layout property with visibility
      const layerWithLayout = {
        ...layerConfig,
        layout: {
          ...layerConfig.layout,
          visibility: 'none' // Start hidden
        }
      };
      
      map.addLayer(layerWithLayout);
      if (DEBUG) console.log(`Added layer: ${layerId} with visibility: none`);
    } else {
      console.warn(`Layer config not found for: ${layerId}`);
      return false;
    }
  }

  return true;
};

/**
 * Show a specific data layer
 */
const showDataLayer = (map, layerName, displayMode) => {
  const layerConfig = DATA_LAYERS[displayMode]?.[layerName];
  if (!layerConfig) {
    console.warn(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    return false;
  }

  const { layerId } = layerConfig;
  if (layerId && layerExists(map, layerId)) {
    if (DEBUG) console.log(`Showing data layer: ${layerId}`);
    
    // Try multiple methods to ensure the layer is shown
    try {
      map.U.show(layerId);
      if (DEBUG) console.log(`Used map.U.show for ${layerId}`);
    } catch (e) {
      console.warn(`map.U.show failed for ${layerId}:`, e);
    }
    
    // Also set visibility to 'visible' as a backup
    try {
      map.setLayoutProperty(layerId, 'visibility', 'visible');
      if (DEBUG) console.log(`Set visibility to 'visible' for ${layerId}`);
    } catch (e) {
      console.warn(`Could not set visibility for ${layerId}:`, e);
    }
  }

  return true;
};

/**
 * Hide a specific data layer
 */
const hideDataLayer = (map, layerName, displayMode) => {
  const layerConfig = DATA_LAYERS[displayMode]?.[layerName];
  if (!layerConfig) {
    console.warn(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    return false;
  }

  const { layerId } = layerConfig;
  if (layerId && layerExists(map, layerId)) {
    if (DEBUG) console.log(`Hiding data layer: ${layerId}`);
    
    // Try multiple methods to ensure the layer is hidden
    try {
      map.U.hide(layerId);
      if (DEBUG) console.log(`Used map.U.hide for ${layerId}`);
    } catch (e) {
      console.warn(`map.U.hide failed for ${layerId}:`, e);
    }
    
    // Also set visibility to 'none' as a backup
    try {
      map.setLayoutProperty(layerId, 'visibility', 'none');
      if (DEBUG) console.log(`Set visibility to 'none' for ${layerId}`);
    } catch (e) {
      console.warn(`Could not set visibility for ${layerId}:`, e);
    }
  }

  return true;
};

/**
 * Set a data layer (show it)
 * 
 * @param {Object} map - The map instance
 * @param {string} layerName - Name of the data layer to set
 * @param {string} displayMode - Current display mode
 * @param {Function} onSuccess - Callback to execute after successful layer change
 * @param {Function} onError - Callback to execute if layer change fails
 */
export const setDataLayer = (map, layerName, displayMode, onSuccess = null, onError = null) => {
  // Validate input
  if (!map) {
    console.error('Map instance is required');
    if (onError) onError('Map instance is required');
    return;
  }

  if (!DATA_LAYERS[displayMode]?.[layerName]) {
    console.error(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    if (onError) onError(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    return;
  }

  // Check if map style is loaded
  if (!map.isStyleLoaded()) {
    if (DEBUG) console.log('Map style not loaded, waiting for style to load...');
    const checkStyleLoaded = () => {
      if (map && map.isStyleLoaded()) {
        setDataLayer(map, layerName, displayMode, onSuccess, onError);
      } else {
        setTimeout(checkStyleLoaded, 100);
      }
    };
    checkStyleLoaded();
    return;
  }

  try {
    // Add the layer if it doesn't exist
    const layerAdded = addDataLayerToMap(map, layerName, displayMode);
    if (!layerAdded) {
      if (onError) onError(`Failed to add data layer: ${layerName}`);
      return;
    }

    // Show the layer
    const layerShown = showDataLayer(map, layerName, displayMode);
    if (!layerShown) {
      if (onError) onError(`Failed to show data layer: ${layerName}`);
      return;
    }

    if (DEBUG) console.log(`Data layer set to: ${layerName}`);
    
    // Execute success callback
    if (onSuccess) {
      onSuccess(layerName);
    }
  } catch (error) {
    console.error('Error setting data layer:', error);
    if (onError) onError(error.message);
  }
};

/**
 * Unset a data layer (hide it)
 * 
 * @param {Object} map - The map instance
 * @param {string} layerName - Name of the data layer to unset
 * @param {string} displayMode - Current display mode
 * @param {Function} onSuccess - Callback to execute after successful layer change
 * @param {Function} onError - Callback to execute if layer change fails
 */
export const unsetDataLayer = (map, layerName, displayMode, onSuccess = null, onError = null) => {
  // Validate input
  if (!map) {
    console.error('Map instance is required');
    if (onError) onError('Map instance is required');
    return;
  }

  if (!DATA_LAYERS[displayMode]?.[layerName]) {
    console.error(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    if (onError) onError(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    return;
  }

  // Check if map style is loaded
  if (!map.isStyleLoaded()) {
    if (DEBUG) console.log('Map style not loaded, waiting for style to load...');
    const checkStyleLoaded = () => {
      if (map && map.isStyleLoaded()) {
        unsetDataLayer(map, layerName, displayMode, onSuccess, onError);
      } else {
        setTimeout(checkStyleLoaded, 100);
      }
    };
    checkStyleLoaded();
    return;
  }

  try {
    // Hide the layer
    const layerHidden = hideDataLayer(map, layerName, displayMode);
    if (!layerHidden) {
      if (onError) onError(`Failed to hide data layer: ${layerName}`);
      return;
    }

    if (DEBUG) console.log(`Data layer unset: ${layerName}`);
    
    // Execute success callback
    if (onSuccess) {
      onSuccess(layerName);
    }
  } catch (error) {
    console.error('Error unsetting data layer:', error);
    if (onError) onError(error.message);
  }
};

/**
 * Toggle a data layer (show if hidden, hide if shown)
 * 
 * @param {Object} map - The map instance
 * @param {string} layerName - Name of the data layer to toggle
 * @param {string} displayMode - Current display mode
 * @param {boolean} isVisible - Current visibility state
 * @param {Function} onSuccess - Callback to execute after successful layer change
 * @param {Function} onError - Callback to execute if layer change fails
 */
export const toggleDataLayer = (map, layerName, displayMode, isVisible, onSuccess = null, onError = null) => {
  if (isVisible) {
    unsetDataLayer(map, layerName, displayMode, onSuccess, onError);
  } else {
    setDataLayer(map, layerName, displayMode, onSuccess, onError);
  }
};

/**
 * Get the currently active data layers for a display mode
 */
export const getCurrentDataLayers = (map, displayMode) => {
  if (!map || !map.isStyleLoaded()) {
    return [];
  }

  const activeLayers = [];
  const availableLayers = DATA_LAYERS[displayMode] || {};

  Object.keys(availableLayers).forEach(layerName => {
    const layerConfig = availableLayers[layerName];
    const { layerId } = layerConfig;
    
    if (layerId && layerExists(map, layerId)) {
      const layer = map.getLayer(layerId);
      if (layer && layer.layout && layer.layout.visibility === 'visible') {
        activeLayers.push(layerName);
      }
    }
  });

  return activeLayers;
};

/**
 * Set a single data layer (radio button behavior - hide all others, show only this one)
 * 
 * @param {Object} map - The map instance
 * @param {string} layerName - Name of the data layer to set
 * @param {string} displayMode - Current display mode
 * @param {Function} onSuccess - Callback to execute after successful layer change
 * @param {Function} onError - Callback to execute if layer change fails
 */
export const setSingleDataLayer = (map, layerName, displayMode, onSuccess = null, onError = null) => {
  // Validate input
  if (!map) {
    console.error('Map instance is required');
    if (onError) onError('Map instance is required');
    return;
  }

  if (!DATA_LAYERS[displayMode]?.[layerName]) {
    console.error(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    if (onError) onError(`Unknown data layer: ${layerName} for display mode: ${displayMode}`);
    return;
  }

  // Check if map style is loaded
  if (!map.isStyleLoaded()) {
    if (DEBUG) console.log('Map style not loaded, waiting for style to load...');
    const checkStyleLoaded = () => {
      if (map && map.isStyleLoaded()) {
        setSingleDataLayer(map, layerName, displayMode, onSuccess, onError);
      } else {
        setTimeout(checkStyleLoaded, 100);
      }
    };
    checkStyleLoaded();
    return;
  }

  try {
    // Get all available layers for this display mode
    const availableLayers = DATA_LAYERS[displayMode] || {};
    const allLayerNames = Object.keys(availableLayers);
    
    // Hide all data layers first
    allLayerNames.forEach(name => {
      const layerConfig = availableLayers[name];
      if (layerConfig && layerConfig.layerId) {
        try {
          map.U.hide(layerConfig.layerId);
        } catch (e) {
          // Layer might not exist yet, ignore error
        }
      }
    });

    // Add the target layer if it doesn't exist
    const layerAdded = addDataLayerToMap(map, layerName, displayMode);
    if (!layerAdded) {
      if (onError) onError(`Failed to add data layer: ${layerName}`);
      return;
    }

    // Show only the target layer
    const layerShown = showDataLayer(map, layerName, displayMode);
    if (!layerShown) {
      if (onError) onError(`Failed to show data layer: ${layerName}`);
      return;
    }

    if (DEBUG) console.log(`Single data layer set to: ${layerName}`);
    
    // Execute success callback
    if (onSuccess) {
      onSuccess(layerName);
    }
  } catch (error) {
    console.error('Error setting single data layer:', error);
    if (onError) onError(error.message);
  }
}; 