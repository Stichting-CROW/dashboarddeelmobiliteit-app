import {layers} from '../layers';

export const addLayers = (map) => {
  // Separate background layers from data layers
  const backgroundLayers = [];
  const dataLayers = [];
  
  Object.keys(layers).forEach((key) => {
    const layerConfig = layers[key];
    if (layerConfig['is-background-layer'] === true) {
      backgroundLayers.push({ key, config: layerConfig });
    } else {
      dataLayers.push({ key, config: layerConfig });
    }
  });

  // Add background layers first (they should be at the bottom)
  backgroundLayers.forEach(({ key, config }) => {
    map.U.addLayer(config);
  });

  // Add data layers after (they should be on top)
  dataLayers.forEach(({ key, config }) => {
    map.U.addLayer(config);
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
