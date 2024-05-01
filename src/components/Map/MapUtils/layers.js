import {layers} from '../layers';

export const addLayers = (map) => {
  Object.keys(layers).forEach((key, idx) => {
    map.U.addLayer(layers[key]);
  })
}

export const activateLayers = (map, allLayers, layersToShow, isRetry) => {
  if(! layersToShow) {
    return;
  }

  // If not loaded: try again in x seconds
  if(! map.isStyleLoaded() && ! isRetry) {
    setTimeout(() => {
      activateLayers(map, allLayers, layersToShow, true);
    }, 5);
    return;
  }

  // Show given layers
  layersToShow.forEach(l => {
    map.U.show(l);
  });

  // Hide all other layersToShow
  Object.keys(allLayers).forEach((key, idx) => {
    if(layersToShow.indexOf(key) <= -1) {
      map.U.hide(key);
    }
  })
}
