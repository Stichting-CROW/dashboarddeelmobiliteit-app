import {layers} from '../layers';

export const addLayers = (map) => {
  Object.keys(layers).forEach((key, idx) => {
    const layer = layers[key];
    
    if (layer.type === 'raster') {
      // Handle raster layers with native MapLibre method
      map.addLayer(layer);
    } else {
      // Handle other layers with mapbox-gl-utils
      try {
        map.U.addLayer(layer);
      } catch (error) {
        console.error('addLayers: Error adding layer with mapbox-gl-utils:', key, error);
        // Fallback to native method
        try {
          map.addLayer(layer);
          console.log('addLayers: Successfully added layer with native method (fallback):', key);
        } catch (fallbackError) {
          console.error('addLayers: Error adding layer with native method (fallback):', key, fallbackError);
        }
      }
    }
    
    // Verify layer was added
    setTimeout(() => {
      const addedLayer = map.getLayer(key);
      // console.log('addLayers: Layer verification for', key, ':', !!addedLayer);
    }, 100);
  });
}

