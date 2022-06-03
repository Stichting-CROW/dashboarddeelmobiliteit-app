import base from '../MapStyles/base.js';
import {layers} from '../layers/index.js';

export const getMapStyles = () => {
  return {
    // NOTE: mapbox:// urls are not supported anymore.
    // See https://github.com/maplibre/maplibre-gl-js/issues/1225#issuecomment-1118769488
    base: base,
    satelite: 'https://api.maptiler.com/maps/hybrid/style.json?key=ZH8yI08EPvuzF57Lyc61'
  }
}

export const setMapStyle = async (map, styleUrlOrObject) => {
  // Code source: https://github.com/mapbox/mapbox-gl-js/issues/4006#issuecomment-368273916
  // and https://github.com/mapbox/mapbox-gl-js/issues/4006#issuecomment-1114095622
  // var currentStyle = map.getStyle();
  // let newStyle = styleUrlOrObject;
  // console.log('styleUrlOrObject', styleUrlOrObject)
  // if(typeof styleUrlOrObject === 'string') {
  //   console.log('nope')
  //   const response = await fetch(styleUrlOrObject);
  //   const responseJson = await response.json();
  //   newStyle = responseJson;
  // }
  // console.log('newStyle', newStyle)
  // // ensure any sources from the current style are copied across to the new style
  // newStyle.sources = Object.assign({},
  //   currentStyle.sources,
  //   newStyle.sources
  // );

  // // find the index of where to insert our layers to retain in the new style
  // let labelIndex = newStyle.layers.findIndex((el) => {
  //   return el.id == 'waterway-label';
  // });

  // // default to on top
  // if (labelIndex === -1) {
  //   labelIndex = newStyle.layers.length;
  // }
  // const appLayers = currentStyle.layers.filter((el) => {
  //   // app layers are the layers to retain, and these are any layers which have a different source set
  //   return (
  //     el.source &&
  //     el.source != 'mapbox://mapbox.satellite' &&
  //     el.source != 'mapbox' &&
  //     el.source != 'composite'
  //   );
  // });
  // newStyle.layers = [
  //   ...newStyle.layers.slice(0, labelIndex),
  //   ...appLayers,
  //   ...newStyle.layers.slice(labelIndex, -1),
  // ];
  // map.setStyle(newStyle);

  // TODO CHECK IF STYLE IS LOADED
  map.setStyle(styleUrlOrObject);
}
