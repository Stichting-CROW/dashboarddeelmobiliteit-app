import { getMapStyles } from './map.js';
import { sources } from '../sources.js';
import { layers } from '../layers/index.js';

// Debug flag to control console.log messages
const DEBUG = false;

/**
 * Background Layer Manager
 * 
 * Provides a centralized system for managing background layers.
 * Handles adding layers if they don't exist, showing/hiding them,
 * and updating the Redux state.
 */

// Available background layers
const BACKGROUND_LAYERS = {
  'base': {
    name: 'Base Map',
    description: 'Standard street map',
    layerId: null, // No additional layer needed for base
    sourceId: null
  },
  'satellite': {
    name: 'Satellite',
    description: 'Satellite imagery',
    layerId: 'luchtfoto-pdok',
    sourceId: 'luchtfoto-pdok'
  }
};

/**
 * Get all available background layer options
 */
export const getAvailableBackgroundLayers = () => {
  return BACKGROUND_LAYERS;
};

/**
 * Check if a background layer exists on the map
 */
const layerExists = (map, layerId) => {
  if (!layerId) return true; // Base layer always exists
  return map.getLayer(layerId) !== undefined;
};

/**
 * Check if there are multiple layers with the same ID
 */
const checkForDuplicateLayers = (map, layerId) => {
  if (!layerId) return;
  
  const style = map.getStyle();
  const layersWithSameId = style.layers.filter(layer => layer.id === layerId);
  
  if (layersWithSameId.length > 1) {
    console.warn(`Found ${layersWithSameId.length} layers with ID: ${layerId}`);
    if (DEBUG) {
      layersWithSameId.forEach((layer, index) => {
        console.log(`Layer ${index + 1}:`, layer);
      });
    }
  }
};

/**
 * Check if a source exists on the map
 */
const sourceExists = (map, sourceId) => {
  if (!sourceId) return true; // Base layer doesn't need a source
  return map.getSource(sourceId) !== undefined;
};

/**
 * Add a background layer and its source to the map
 */
const addBackgroundLayerToMap = (map, layerName) => {
  const layerConfig = BACKGROUND_LAYERS[layerName];
  if (!layerConfig) {
    console.warn(`Unknown background layer: ${layerName}`);
    return false;
  }

  // Base layer doesn't need additional layers/sources
  if (layerName === 'base') {
    return true;
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
 * Force remove and re-add a layer to ensure proper visibility control
 */
const forceReaddLayer = (map, layerId) => {
  try {
    const layerConfig = layers[layerId];
    if (layerConfig) {
      // Remove the layer
      map.removeLayer(layerId);
      if (DEBUG) console.log(`Removed layer: ${layerId}`);
      
      // Re-add with proper layout
      const layerWithLayout = {
        ...layerConfig,
        layout: {
          ...layerConfig.layout,
          visibility: 'none' // Start hidden
        }
      };
      
      map.addLayer(layerWithLayout);
      if (DEBUG) console.log(`Re-added layer: ${layerId} with visibility: none`);
      return true;
    }
  } catch (e) {
    console.warn(`Failed to force re-add layer ${layerId}:`, e);
  }
  return false;
};

/**
 * Show a specific background layer and hide others
 */
const showBackgroundLayer = (map, layerName) => {
  const layerConfig = BACKGROUND_LAYERS[layerName];
  if (!layerConfig) {
    console.warn(`Unknown background layer: ${layerName}`);
    return false;
  }

  if (DEBUG) console.log(`Setting background layer to: ${layerName}`);

  // Check for duplicate layers
  Object.keys(BACKGROUND_LAYERS).forEach(name => {
    const config = BACKGROUND_LAYERS[name];
    if (config.layerId) {
      checkForDuplicateLayers(map, config.layerId);
    }
  });

  // Hide all background layers first
  Object.keys(BACKGROUND_LAYERS).forEach(name => {
    const config = BACKGROUND_LAYERS[name];
    if (config.layerId && layerExists(map, config.layerId)) {
      if (DEBUG) console.log(`Hiding layer: ${config.layerId}`);
      
      // Try multiple methods to ensure the layer is hidden
      try {
        map.U.hide(config.layerId);
        if (DEBUG) console.log(`Used map.U.hide for ${config.layerId}`);
      } catch (e) {
        console.warn(`map.U.hide failed for ${config.layerId}:`, e);
      }
      
      // Also set visibility to 'none' as a backup
      try {
        map.setLayoutProperty(config.layerId, 'visibility', 'none');
        if (DEBUG) console.log(`Set visibility to 'none' for ${config.layerId}`);
      } catch (e) {
        console.warn(`Could not set visibility for ${config.layerId}:`, e);
      }
      
      // Check if layer is actually hidden
      try {
        const layer = map.getLayer(config.layerId);
        if (layer && layer.layout && layer.layout.visibility) {
          if (DEBUG) console.log(`Layer ${config.layerId} visibility: ${layer.layout.visibility}`);
        } else {
          if (DEBUG) console.log(`Layer ${config.layerId} - no visibility property found, forcing re-add`);
          // Force re-add the layer with proper visibility control
          forceReaddLayer(map, config.layerId);
        }
      } catch (e) {
        console.warn(`Could not check layer visibility for ${config.layerId}:`, e);
      }
      
      // Force a map repaint to ensure changes are applied
      try {
        map.triggerRepaint();
        if (DEBUG) console.log(`Triggered repaint after hiding ${config.layerId}`);
      } catch (e) {
        console.warn(`Could not trigger repaint:`, e);
      }
    }
  });

  // Show the requested layer
  if (layerName === 'base') {
    // For base layer, we just hide the satellite layer (already done above)
    if (DEBUG) console.log('Base layer selected - satellite should be hidden');
  } else {
    // Show the specific background layer
    const { layerId } = layerConfig;
    if (layerId && layerExists(map, layerId)) {
      if (DEBUG) console.log(`Showing layer: ${layerId}`);
      
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
      
      // Check if layer is actually shown
      try {
        const layer = map.getLayer(layerId);
        if (layer && layer.layout && layer.layout.visibility) {
          if (DEBUG) console.log(`Layer ${layerId} visibility: ${layer.layout.visibility}`);
        }
      } catch (e) {
        console.warn(`Could not check layer visibility for ${layerId}:`, e);
      }
    }
  }

  return true;
};

/**
 * Set the background layer
 * 
 * @param {Object} map - The map instance
 * @param {string} layerName - Name of the background layer to set
 * @param {Function} onSuccess - Callback to execute after successful layer change
 * @param {Function} onError - Callback to execute if layer change fails
 */
export const setBackgroundLayer = (map, layerName, onSuccess = null, onError = null) => {
  // Validate input
  if (!map) {
    console.error('Map instance is required');
    if (onError) onError('Map instance is required');
    return;
  }

  if (!BACKGROUND_LAYERS[layerName]) {
    console.error(`Unknown background layer: ${layerName}`);
    if (onError) onError(`Unknown background layer: ${layerName}`);
    return;
  }

  // Check if map style is loaded
  if (!map.isStyleLoaded()) {
    if (DEBUG) console.log('Map style not loaded, waiting for style to load...');
    const checkStyleLoaded = () => {
      if (map && map.isStyleLoaded()) {
        setBackgroundLayer(map, layerName, onSuccess, onError);
      } else {
        setTimeout(checkStyleLoaded, 100);
      }
    };
    checkStyleLoaded();
    return;
  }

  try {
    // Add the layer if it doesn't exist
    const layerAdded = addBackgroundLayerToMap(map, layerName);
    if (!layerAdded) {
      if (onError) onError(`Failed to add background layer: ${layerName}`);
      return;
    }

    // Show the layer
    const layerShown = showBackgroundLayer(map, layerName);
    if (!layerShown) {
      if (onError) onError(`Failed to show background layer: ${layerName}`);
      return;
    }

    if (DEBUG) console.log(`Background layer set to: ${layerName}`);
    
    // Execute success callback
    if (onSuccess) {
      onSuccess(layerName);
    }
  } catch (error) {
    console.error('Error setting background layer:', error);
    if (onError) onError(error.message);
  }
};

/**
 * Get the currently active background layer
 */
export const getCurrentBackgroundLayer = (map) => {
  if (!map || !map.isStyleLoaded()) {
    return 'base'; // Default fallback
  }

  // Check if satellite layer is visible
  const satelliteConfig = BACKGROUND_LAYERS['satellite'];
  if (satelliteConfig.layerId && layerExists(map, satelliteConfig.layerId)) {
    // Check if the layer is visible (this is a simplified check)
    // In a real implementation, you might want to track the current layer in state
    const layer = map.getLayer(satelliteConfig.layerId);
    if (layer && layer.layout && layer.layout.visibility === 'visible') {
      return 'satellite';
    }
  }

  return 'base';
}; 