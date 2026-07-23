import {layers} from '../layers';
import { whenMapStyleReady } from './mapGuards';

const setLayerVisibility = (map, layerId, visibility) => {
  if (!map || !map.getLayer) return;
  if (!map.getLayer(layerId)) return;

  try {
    map.setLayoutProperty(layerId, 'visibility', visibility);
  } catch (e) {
    // Fallback to map.U helper if direct call failed.
    try {
      if (visibility === 'visible') {
        map.U.show(layerId);
      } else {
        map.U.hide(layerId);
      }
    } catch {
      // Layer may be in an invalid state.
    }
  }
};

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
    // Start data layers hidden so they don't flash before activateLayers runs.
    const configWithHiddenLayout = {
      ...config,
      layout: {
        ...config.layout,
        visibility: 'none'
      }
    };
    map.U.addLayer(configWithHiddenLayout);
  });
}

export const activateLayers = (map, allLayers, layersToShow, isRetry) => {
  if(! layersToShow || ! map) {
    return;
  }

  // Hide layers
  const doAction = () => {
    // Show given layers
    layersToShow.forEach(l => {
      const data = allLayers[l];
      // Only activate layer if it's not a background layer
      if(data && !data['is-background-layer']) {
        setLayerVisibility(map, l, 'visible');
      }
    });

    // Hide all other layers (but not background layers)
    Object.keys(allLayers).forEach((key) => {
      const data = allLayers[key];
      // Don't hide background layers - they're managed by setBackgroundLayer
      if(layersToShow.indexOf(key) <= -1 && data && !data['is-background-layer']) {
        setLayerVisibility(map, key, 'none');
      }
    });
  }

  if (!map.isStyleLoaded() && !isRetry) {
    // Retry once the style is ready. This prevents the race where the
    // transition from Zones to Aanbod runs before MapLibre has finished
    // processing the style and layers can't be hidden yet.
    if (process.env.NODE_ENV === 'development') {
      console.log('activateLayers: map style not ready, deferring', layersToShow);
    }
    whenMapStyleReady(map, () => {
      activateLayers(map, allLayers, layersToShow, true);
    });
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    const parkIds = ['vehicles-point', 'vehicles-clusters', 'vehicles-clusters-count', 'vehicles-clusters-point', 'vehicles-heatmap'];
    const activeParkIds = layersToShow.filter(id => parkIds.includes(id));
    const hiddenParkIds = Object.keys(allLayers).filter(id => parkIds.includes(id) && layersToShow.indexOf(id) <= -1);
    if (activeParkIds.length > 0 || hiddenParkIds.length > 0) {
      console.log('activateLayers: layersToShow', layersToShow, 'show', activeParkIds, 'hide', hiddenParkIds);
    }
  }

  doAction();

}
