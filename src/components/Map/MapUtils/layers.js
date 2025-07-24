import {layers} from '../layers';

export const addLayers = (map) => {
  Object.keys(layers).forEach((key, idx) => {
    const layer = layers[key];
    if (layer.type === 'raster') {
      // Handle raster layers with native MapLibre method
      map.addLayer(layer);
    } else {
      // Handle other layers with mapbox-gl-utils
      map.U.addLayer(layer);
    }
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

    // Hide all other layersToShow
    Object.keys(allLayers).forEach((key, idx) => {
      if(layersToShow.indexOf(key) <= -1) {
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
