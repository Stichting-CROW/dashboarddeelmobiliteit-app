import base from '../MapStyles/base.js';

export const getMapStyles = () => {
  return {
    // NOTE: mapbox:// urls are not supported anymore.
    // See https://github.com/maplibre/maplibre-gl-js/issues/1225#issuecomment-1118769488
    base: base,
    satelite: 'https://api.maptiler.com/maps/hybrid/style.json?key=ZH8yI08EPvuzF57Lyc61'
  }
}
