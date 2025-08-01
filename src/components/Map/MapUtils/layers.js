import {layers} from '../layers';

export const addLayers = (map) => {
  Object.keys(layers).forEach((key, idx) => {
    map.U.addLayer(layers[key]);
  });
}

export const activateLayers = (map, allLayers, layersToShow, isRetry) => {
  if(! layersToShow) {
    return;
  }

  // Hide layers
  const doAction = () => {
    // Show given layers
    layersToShow.forEach(l => {
      const data = allLayers[l];
      // Only activate layer if it's not a background layer
      if(! data['is-background-layer']) {
        map.U.show(l);
      }
    });

    // Hide all other layersToShow (but not background layers)
    Object.keys(allLayers).forEach((key, idx) => {
      const data = allLayers[key];
      // Don't hide background layers - they're managed by setBackgroundLayer
      if(layersToShow.indexOf(key) <= -1 && !data['is-background-layer']) {
        map.U.hide(key);
      }
    });
  }

  // If not loaded: try again in x seconds
  // if(! map.isStyleLoaded() && ! isRetry) {
  //   setTimeout(() => {
  //     activateLayers(map, allLayers, layersToShow, true);
  //   }, 250);

  //   return;
  // }

  doAction();

}
