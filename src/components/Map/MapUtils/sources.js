import {sources} from '../sources.js';

export const addSources = (map) => {
  Object.keys(sources).forEach((key, idx) => {
    map.U.addGeoJSON(key, null, sources[key]);
  })
}
