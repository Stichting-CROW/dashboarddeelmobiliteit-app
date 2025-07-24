import {sources} from '../sources.js';

export const addSources = (map) => {
  Object.keys(sources).forEach((key, idx) => {
    const source = sources[key];
    if (source.type === 'raster') {
      // Handle raster sources differently
      map.addSource(key, source);
    } else {
      // Handle GeoJSON sources
      map.U.addGeoJSON(key, null, source);
    }
  })
}
