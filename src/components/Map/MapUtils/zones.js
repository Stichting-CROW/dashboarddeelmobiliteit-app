// Mapbox draw functionality
// https://github.com/mapbox/mapbox-gl-draw
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode'

// Import API functions
import {getAdminZones} from '../../../api/zones';

const initMapDrawLogic = (theMap) => {
  if(! theMap) return;

  // Don't init multiple times
  if(window.CROW_DD && window.CROW_DD.theDraw) return;

  // Add custom draw mode: 'StaticMode'
  // https://github.com/mapbox/mapbox-gl-draw-static-mode
  const modes = MapboxDraw.modes;
  modes.static = StaticMode;

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: modes,
    // Custom styles https://stackoverflow.com/a/51305508
    // userProperties: true,
    // styles: []
  });
  // for more details: https://docs.mapbox.com/mapbox-gl-js/api/#map#addcontrol
  theMap.addControl(draw, 'top-left');
  // Set Draw to window, for easily making global changes
  if(window.CROW_DD) {
    window.CROW_DD.theDraw = draw;
  } else {
    window.CROW_DD = {theDraw: draw}
  }
}

export const addZonesToMap = async (token, filter) => {
  if(! window.CROW_DD) return;

  const zones = await getAdminZones(token, filter);

  if(Object.keys(zones).length <= 0) {
    return;
  }

  let idx = 0;
  Object.keys(zones).forEach(x => {
    const zone = zones[x];
    window.CROW_DD.theDraw.add({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          zone_type: zone.geography_type
        },
        id: 'example-id' + zone.zone_id,
        geometry: zone.area.geometry
      }]
    });
    console.log(zone.area.geometry);
    idx++;
  });
}

export {
  initMapDrawLogic,
  getAdminZones
}