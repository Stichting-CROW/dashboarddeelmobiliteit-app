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
import {
  getAdminZones,
  getPublicZones
} from '../../../api/zones';

const initMapDrawLogic = (theMap, isAdminMode) => {
  if(! theMap) return;

  // Don't init multiple times
  if(window.CROW_DD && window.CROW_DD.theDraw) return;

  // Add custom draw mode: 'StaticMode'
  // https://github.com/mapbox/mapbox-gl-draw-static-mode
  let modes = MapboxDraw.modes;
  modes = MapboxDrawWaypoint.enable(modes);// Disable moving features
  modes.static = StaticMode;

  const publicStyles = [
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
        'fill-opacity': [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'user_geography_type'], // get the property
          'no_parking', 0.2,
          'monitoring', 0.3,
          'stop', 0.8,
          0.5
        ]
      }
    }
  ];

  const adminStyles = [
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
      "filter": [
        "all",
        ["==", "meta", "vertex"],
        ["!=", 'meta', 'midpoint'],
        ["==", "$type", "Point"],
        ["!=", "mode", "static"]
      ],
      "paint": {
        "circle-radius": 4,
        "circle-color": [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'user_geography_type'], // get the property
          'stop', themes.zone.stop.primaryColor,
          'no_parking', themes.zone.no_parking.primaryColor,
          'monitoring', themes.zone.monitoring.primaryColor,
          "#D20C0C"
        ]
      }
    },
    // Midpoints points
    {
      "id": "gl-draw-polygon-and-line-midpoint-active",
      "type": "circle",
      "filter": [
        "all",
        ["==", 'meta', 'midpoint'],
        ["==", "$type", "Point"],
        ["!=", "mode", "static"]
      ],
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
      },
      'circle-opacity': 0.5
    }
  ];

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: modes,
    // Custom styles https://stackoverflow.com/a/51305508
    userProperties: true,
    styles: isAdminMode ? [...publicStyles, ...adminStyles] : publicStyles
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

export const addAdminZonesToMap = async (token, filter) => {
  if(! window.CROW_DD) return;

  // Get admin zones
  let zones = await getAdminZones(token, filter);
  if(Object.keys(zones).length <= 0) {
    return;
  }

  // Layer/sort zones per geography_type (monitoring/stop/no_parking)
  const groupedZones = groupZonesPerGeographyType(zones)

  groupedZones.forEach((groupZones) => {
    let featuresInThisGroup = [];
    groupZones.forEach(x => {
      const zone = x;
      featuresInThisGroup.push({
        type: 'Feature',
        properties: {
          geography_type: zone.geography_type
        },
        id: zone.zone_id,
        geometry: zone.area.geometry
      })
    });
    // Now add feature collection/group
    window.CROW_DD.theDraw.add({
      type: 'FeatureCollection',
      features: featuresInThisGroup
    });
  })
}

export const addPublicZonesToMap = async (token, filter) => {
  if(! window.CROW_DD) return;

  // Get admin zones
  let zones = await getPublicZones(token, filter);
  if(Object.keys(zones).length <= 0) {
    return;
  }

  // Layer/sort zones per geography_type (monitoring/stop/no_parking)
  const groupedZones = groupZonesPerGeographyType(zones)

  groupedZones.forEach((groupZones) => {
    let featuresInThisGroup = [];
    groupZones.forEach(x => {
      const zone = x;
      featuresInThisGroup.push({
        type: 'Feature',
        properties: {
          geography_type: zone.geography_type
        },
        id: zone.zone_id,
        geometry: zone.area.geometry
      })
    });
    // Now add feature collection/group
    window.CROW_DD.theDraw.add({
      type: 'FeatureCollection',
      features: featuresInThisGroup
    });
  })
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

const sortZonesInPreferedOrder = (zones) => {
  const groupedZones = groupZonesPerGeographyType(zones);
  let groupedZonesToReturn = [];
  groupedZones[0].forEach(x => {
    groupedZonesToReturn.push(x);
  })
  groupedZones[1].forEach(x => {
    groupedZonesToReturn.push(x);
  })
  groupedZones[2].forEach(x => {
    groupedZonesToReturn.push(x);
  })
  return groupedZonesToReturn;
}

const groupZonesPerGeographyType = (zones) => {
  const groupedZones = [
    // First, get all 'monitoring' zones
    zones.filter(x => x.geography_type === 'monitoring'),
    // Next, get all 'no_parking' zones
    zones.filter(x => x.geography_type === 'no_parking'),
    // Next, get all 'stop' zones
    zones.filter(x => x.geography_type === 'stop'),
  ]
  return groupedZones;
}

const getLocalDrawsOnly = (draws) => {
  // If id is a string and not int, it is generated by mapbox-gl-draw
  let localDraws = [];
  draws.map(x => {
    if(x.id &&
        // If ID is a string, it's a non-saved, drawed polygon
        typeof x.id === 'string' &&
        // If geometry.coordinates[0] is not set, no polygon is drawed yet
        x.geometry && x.geometry.coordinates && x.geometry.coordinates[0] && x.geometry.coordinates[0].length > 2
    ) {
      localDraws.push(x);
    }
  });
  return localDraws;
}

const getDraftFeatureId = () => {
  const allDraws = window.CROW_DD.theDraw.getAll();
  const localDraws = getLocalDrawsOnly(allDraws.features);
  if(localDraws && localDraws.length === 1 && localDraws[0].id) {
    return localDraws[0].id;
  }
  return false;
}

export {
  initMapDrawLogic,
  getAdminZones,
  initSelectToEdit,
  getZoneById,
  sortZonesInPreferedOrder,
  getLocalDrawsOnly,
  getDraftFeatureId
}
