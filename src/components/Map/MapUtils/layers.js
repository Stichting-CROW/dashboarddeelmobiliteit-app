import {layers} from '../layers';

export const addLayers = (map) => {
  Object.keys(layers).forEach((key, idx) => {
    map.U.addLayer(layers[key]);
  })
}

export const activateLayers = (map, allLayers, layersToShow) => {
  if(! layersToShow) {
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
