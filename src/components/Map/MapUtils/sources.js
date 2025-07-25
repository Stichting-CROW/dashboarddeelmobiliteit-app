import {sources} from '../sources.js';

export const addSources = (map) => {
  Object.keys(sources).forEach((key, idx) => {
    const source = sources[key];
    
    // Check if source already exists
    const existingSource = map.getSource(key);
    if (existingSource) {
      console.log(`addSources: Source ${key} already exists, skipping`);
      return;
    }
    
    console.log(`addSources: Adding source ${key}:`, source);
    
    if (source.type === 'raster') {
      try {
        map.addSource(key, source);
        console.log(`addSources: Successfully added raster source ${key}`);
      } catch (error) {
        console.error(`addSources: Error adding raster source ${key}:`, error);
      }
    } else {
      // Handle GeoJSON sources - use native MapLibre method
      try {
        // Use native MapLibre method with full source configuration
        const sourceConfig = {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          },
          // Preserve clustering properties if they exist
          ...(source.cluster && { cluster: source.cluster }),
          ...(source.clusterRadius && { clusterRadius: source.clusterRadius }),
          ...(source.clusterMaxZoom && { clusterMaxZoom: source.clusterMaxZoom })
        };
        
        console.log(`addSources: Creating source ${key} with config:`, sourceConfig);
        map.addSource(key, sourceConfig);
        console.log(`addSources: Successfully added source ${key}`);
      } catch (error) {
        console.error(`addSources: Error adding source ${key}:`, error);
        // Fallback to mapbox-gl-utils
        try {
          map.U.addGeoJSON(key, null, source);
          console.log('addSources: Successfully added GeoJSON source with fallback:', key);
        } catch (fallbackError) {
          console.error('addSources: Error adding GeoJSON source with fallback:', key, fallbackError);
        }
      }
    }
    
    // Verify source was added
    setTimeout(() => {
      const addedSource = map.getSource(key);
      console.log(`addSources: Source verification for ${key}:`, !!addedSource);
      if (addedSource) {
        console.log(`addSources: Source ${key} properties:`, {
          type: addedSource.type,
          cluster: addedSource.cluster,
          clusterRadius: addedSource.clusterRadius
        });
      } else {
        console.warn(`addSources: Source ${key} was not found after timeout`);
      }
    }, 500); // Increased from 100ms to 500ms
  });
}
