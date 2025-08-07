import baseStyle from '../MapStyles/base.js';
import nine3030Style from '../MapStyles/nine3030.js';
import md5 from 'md5';
import {layers} from '../layers/index.js';
import {addSources} from './sources.js';
import {
  addLayers,
  activateLayers
} from './layers.js';

// Import the new background layer manager
import { setBackgroundLayer as setBackgroundLayerNew } from './backgroundLayerManager.js';

export const getMapStyles = () => {
  return {
    // NOTE: mapbox:// urls are not supported anymore.
    // See https://github.com/maplibre/maplibre-gl-js/issues/1225#issuecomment-1118769488
    base: nine3030Style,
    satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=ZH8yI08EPvuzF57Lyc61'
  }
}

// Legacy function for backward compatibility
export const setBackgroundLayer = (map, name, callback) => {
  setBackgroundLayerNew(map, name, callback);
}

// Variable to keep track of the map style that we used last
let mapStyleHash = md5(getMapStyles().base);
// Function applyMapStyle -- It reorders all layers, so the layers stay in the order we want
export const applyMapStyle = async (map, styleUrlOrObject) => {
  if(! map) return;
  if(! map.isStyleLoaded()) return;
  if(! styleUrlOrObject) return;

  const newMapStyleHash = md5(styleUrlOrObject);
  if(mapStyleHash === newMapStyleHash) {
    return;
  }
  mapStyleHash = newMapStyleHash;

  // Code source: https://github.com/mapbox/mapbox-gl-js/issues/4006#issuecomment-368273916
  // and https://github.com/mapbox/mapbox-gl-js/issues/4006#issuecomment-1114095622
  //
  // Related:
  //- https://stackoverflow.com/a/36169495
  //- https://bl.ocks.org/tristen/0c0ed34e210a04e89984
  //- https://stackoverflow.com/a/42911634
  const currentStyle = map.getStyle();

  let newStyle = styleUrlOrObject;
  // If style URL was given: fetch JSON
  if(typeof styleUrlOrObject === 'string') {
    const response = await fetch(styleUrlOrObject);
    const responseJson = await response.json();
    newStyle = responseJson;
  }

  // Ensure any sources from the current style are copied across to the new style
  newStyle.sources = Object.assign({},
    currentStyle.sources,
    newStyle.sources
  );

  // Find the index of where to insert our layers to retain in the new style
  // Default to on top
  const labelIndex = newStyle.layers.length;

  // App layers are the layers to retain
  const appLayers = currentStyle.layers.filter((el) => {
    return layers[el.id]//Keep layer if it's a DD layer
            || el.id.indexOf('gl-draw-') > -1;//Keep layer if it's a gl-draw layer;
  });

  // Separate background layers from other app layers
  const backgroundLayers = appLayers.filter((el) => {
    const layerConfig = layers[el.id];
    return layerConfig && layerConfig['is-background-layer'] === true;
  });

  const dataLayers = appLayers.filter((el) => {
    const layerConfig = layers[el.id];
    return !layerConfig || layerConfig['is-background-layer'] !== true;
  });

  // Remove appLayers from newStyle.layers to prevent duplicates
  newStyle.layers = newStyle.layers.filter((el) => {
    return ! layers[el.id]//Remove layer if it's a DD layer
            && el.id.indexOf('gl-draw-') <= -1;//Remove layer if it's a gl-draw layer;
  });

  // Insert background layers at the beginning (after the first few base layers)
  // Find a good insertion point after the basic map layers but before labels
  let insertionIndex = 0;
  for (let i = 0; i < newStyle.layers.length; i++) {
    const layer = newStyle.layers[i];
    // Insert after basic map layers like 'land', 'water', 'building', etc.
    // but before labels and other overlay layers
    if (layer.id === 'building' || layer.id === 'road-simple' || layer.id === 'bridge-simple') {
      insertionIndex = i + 1;
      break;
    }
  }

  // Insert background layers at the proper position
  newStyle.layers.splice(insertionIndex, 0, ...backgroundLayers);

  // Add data layers at the end (on top)
  newStyle.layers = newStyle.layers.concat(dataLayers);

  // Set new map style (having style _and_ DD layers)
  await map.setStyle(newStyle);
}
