// Mapbox draw functionality
// https://github.com/mapbox/mapbox-gl-draw
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode'
import {themes} from '../../../themes';

// Don't allow moving features, only allow changing bounds
// Repo: https://github.com/zakjan/mapbox-gl-draw-waypoint
import * as MapboxDrawWaypoint from 'mapbox-gl-draw-waypoint';

// Import API functions
import {getAdminZones} from '../../../api/zones';

const initMapDrawLogic = (theMap) => {
  if(! theMap) return;

  // Don't init multiple times
  if(window.CROW_DD && window.CROW_DD.theDraw) return;

  // Add custom draw mode: 'StaticMode'
  // https://github.com/mapbox/mapbox-gl-draw-static-mode
  let modes = MapboxDraw.modes;
  modes = MapboxDrawWaypoint.enable(modes);// Disable moving features
  modes.static = StaticMode;

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: modes,
    // Custom styles https://stackoverflow.com/a/51305508
    userProperties: true,
    styles: [
      // Polygon fill
      {
        'id': 'gl-draw-polygon-fill',
        'type': 'fill',
        'filter': [
          'all',
          // ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
        ],
        'paint': {
          'fill-color': [
            // Matching based on user property: https://stackoverflow.com/a/70721495
            'match', ['get', 'user_geography_type'], // get the property
            'stop', themes.zone.stop.primaryColor,
            'no_parking', themes.zone.no_parking.primaryColor,
            'monitoring', themes.zone.monitoring.primaryColor,
            themes.zone.monitoring.primaryColor
           ],
          'fill-outline-color': '#3bb2d0',
          'fill-opacity': 0.5
        }
      },
      // Polygon outline stroke
      // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
      {
        'id': 'gl-draw-polygon-stroke-active',
        'type': 'line',
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        'filter': [
          'all',
          ['==', '$type', 'Polygon'],
          ['!=', 'active', 'false']
        ],
        "paint": {
          "line-color": [
            // Matching based on user property: https://stackoverflow.com/a/70721495
            'match', ['get', 'user_geography_type'], // get the property
            'stop', themes.zone.stop.primaryColor,
            'no_parking', themes.zone.no_parking.primaryColor,
            'monitoring', themes.zone.monitoring.primaryColor,
            "#D20C0C"
           ],
          "line-dasharray": [0.2, 2],
          "line-width": 3
        }
      },
      // Vertex points
      {
        "id": "gl-draw-polygon-and-line-vertex-active",
        "type": "circle",
        "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        "paint": {
          "circle-radius": 3,
          "circle-color": [
            // Matching based on user property: https://stackoverflow.com/a/70721495
            'match', ['get', 'user_geography_type'], // get the property
            'stop', themes.zone.stop.primaryColor,
            'no_parking', themes.zone.no_parking.primaryColor,
            'monitoring', themes.zone.monitoring.primaryColor,
            "#D20C0C"
          ]
        }
      }
    ]
  });
  // for more details: https://docs.mapbox.com/mapbox-gl-js/api/#map#addcontrol
  theMap.addControl(draw, 'top-left');
  // Set Draw to window, for easily making global changes
  if(window.CROW_DD) {
    window.CROW_DD.theDraw = draw;
  } else {
    window.CROW_DD = {theDraw: draw}
  }
  // Select area to edit it
  initSelectToEdit(theMap);
}

export const addZonesToMap = async (token, filter) => {
  if(! window.CROW_DD) return;

  const zones = await getAdminZones(token, filter);

  if(Object.keys(zones).length <= 0) {
    return;
  }

  Object.keys(zones).forEach(x => {
    const zone = zones[x];
    console.log('zone.geography_type', zone.geography_type)
    window.CROW_DD.theDraw.add({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          geography_type: zone.geography_type
        },
        id: zone.zone_id,
        geometry: zone.area.geometry
      }]
    });
  });
}

const initSelectToEdit = (theMap) => {
  if(! theMap) return;

  const onSelectionChange = (e) => {
    if(! e) return;
    // Check if only one feature was selected
    const didSelectOneFeature = e.features && e.features.length === 1;
    if(! didSelectOneFeature) return;
    const zoneId = e.features[0].id;
    // Trigger setSelectedZone custom event (see FilterbarZones.tsx)
    const event = new CustomEvent('setSelectedZone', {
      detail: zoneId
    });
    window.dispatchEvent(event);
  }
  theMap.on('draw.selectionchange', onSelectionChange);
}

const getZoneById = (zones, id) => {
  if(! zones || ! id) return;

  const filteredZones = zones.filter((x) => {
    return x.zone_id === id;
  })
  if(filteredZones && filteredZones[0]) {
    return filteredZones[0];
  }
  return {};
}

export {
  initMapDrawLogic,
  getAdminZones,
  initSelectToEdit,
  getZoneById
}
