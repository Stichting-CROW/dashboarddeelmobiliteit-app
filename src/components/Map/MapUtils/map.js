import baseStyle from '../MapStyles/base.js';
import nine3030Style from '../MapStyles/nine3030.js';
import md5 from 'md5';
import {layers} from '../layers/index.js';
import {addSources} from './sources.js';
import {
  addLayers,
  activateLayers
} from './layers.js';

// Cache for map styles to avoid repeated fetches
const styleCache = new Map();

export const getMapStyles = () => {
  return {
    // NOTE: mapbox:// urls are not supported anymore.
    // See https://github.com/maplibre/maplibre-gl-js/issues/1225#issuecomment-1118769488
    base: nine3030Style,
    satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=ZH8yI08EPvuzF57Lyc61'
  }
}

export const setBackgroundLayer = (map, name, setMapStyle) => {
  // Check if setMapStyle func was given
  if(! setMapStyle) {
    console.error('setMapStyle not given');
    return;
  }

  // Check if map style was loaded
  if(! map.isStyleLoaded()) {
    return;
  }

  setMapStyle(name);

  if(name === 'base') {
    map.U.hide('luchtfoto-pdok');
  }
  else {
    map.U.show(name);
  }
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
    // Check cache first
    if (styleCache.has(styleUrlOrObject)) {
      newStyle = styleCache.get(styleUrlOrObject);
    } else {
      try {
        const response = await fetch(styleUrlOrObject);
        if (!response.ok) {
          throw new Error(`Failed to fetch style: ${response.statusText}`);
        }
        const responseJson = await response.json();
        newStyle = responseJson;
        // Cache the style
        styleCache.set(styleUrlOrObject, newStyle);
      } catch (error) {
        console.error('Error fetching map style:', error);
        throw error;
      }
    }
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

  // Remove appLayers from newStyle.layers to prevent duplicates
  newStyle.layers = newStyle.layers.filter((el) => {
    return ! layers[el.id]//Remove layer if it's a DD layer
            && el.id.indexOf('gl-draw-') <= -1;//Remove layer if it's a gl-draw layer;
  });

  // Add app layers to newStyle's layers
  newStyle.layers = newStyle.layers.concat(appLayers);

  // Set new map style (having style _and_ DD layers)
  await map.setStyle(newStyle);
}

// Function to preload map styles for faster switching
export const preloadMapStyles = async () => {
  const mapStyles = getMapStyles();
  
  for (const [name, style] of Object.entries(mapStyles)) {
    if (typeof style === 'string' && !styleCache.has(style)) {
      try {
        const response = await fetch(style);
        if (response.ok) {
          const styleJson = await response.json();
          styleCache.set(style, styleJson);
        }
      } catch (error) {
        console.warn(`Failed to preload style ${name}:`, error);
      }
    }
  }
}

// Function to clear style cache (useful for memory management)
export const clearStyleCache = () => {
  styleCache.clear();
}
