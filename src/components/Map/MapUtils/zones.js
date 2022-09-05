// Mapbox draw functionality
// https://github.com/mapbox/mapbox-gl-draw
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import maplibregl from 'maplibre-gl';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode'
import {themes} from '../../../themes';
import {getVehicleIconUrl} from '../../../helpers/vehicleTypes';
import {useLocation, useRouteMatch} from "react-router-dom";
import center from '@turf/center'

// import {getMapboxDrawLayers} from './layers.js'

// Don't allow moving features, only allow changing bounds
// Repo: https://github.com/zakjan/mapbox-gl-draw-waypoint
import * as MapboxDrawWaypoint from 'mapbox-gl-draw-waypoint';

// Import API functions
import {
  getAdminZones,
  getPublicZones
} from '../../../api/zones';

const setPublicZoneUrl   = (geographyId) => {
  if(! geographyId) return;
  const stateObj = { geography_id: geographyId };
  window.history.pushState(stateObj, 'Zone details', `/map/zones/${geographyId}`);
}

const setAdminZoneUrl   = (geographyId) => {
  if(! geographyId) return;
  const stateObj = { geography_id: geographyId };
  window.history.pushState(stateObj, 'Zone edit', `/admin/zones/${geographyId}`);
}

const getNumPlacesAvailable = (stop) => {
  if(! stop) return;
  const realtimeData = stop.realtime_data;
  if(! realtimeData) return;
  if(! realtimeData.num_places_available) return;

  // If it's a combined capacity: return this capacity
  if(stop.capacity && stop.capacity.combined) {
    return stop.capacity.combined;
  }

  let total = 0;
  Object.keys(stop.capacity).forEach(key => {
    total += parseInt(stop.capacity[key]);
  });

  return total;
}

const getNumVehiclesAvailable = (realtimeData) => {
  if(! realtimeData) return;
  if(! realtimeData.num_vehicles_available) return;

  let total = 0;
  Object.keys(realtimeData.num_vehicles_available).forEach(key => {
    total += parseInt(realtimeData.num_vehicles_available[key]);
  });

  return total;
}

const getIndicatorColor = (parked, capacity) => {
  const pct = parseInt(parked/capacity*100);

  if(isNaN(pct)) {
    return 'transparent';
  }
  return calculateGradient(parked, capacity);
}

const generatePopupHtml = (feature) => {
  if(! feature || ! feature.layer) return '<div />';
  if(! feature.properties) return '<div />';
  if(! feature.properties.stop) return '<div />';
  const stop = JSON.parse(feature.properties.stop);
  if(! stop) return `
    <div class="font-inter" style="min-width:180px">
      <div class="text-lg font-bold">
        ${feature.properties.name}
      </div>
    </div>
  `;
  if(! stop.realtime_data) return '<div>:)</div>';// Realtime data not yet loaded

  const isControlledAutomatically = stop.status.control_automatic === true;
  const isManuallySetToOpen = ! isControlledAutomatically && stop.status.is_returning === true;
  const isManuallySetToClosed = ! isControlledAutomatically && stop.status.is_returning === false;

  const getCapacityForModality = (capacity, modality) => {
    // Return nothing if no stop capacity was found
    if(! capacity || capacity.length === 0) return;
    // If it's a modality specific value: return value
    if(capacity[modality]) return capacity[modality];
    // If it's a combined value: return combined
    return capacity.combined;
  }

  const getAvailableForModality = (num_places_available, modality) => {
    // Return nothing if no stop capacity was found
    if(! num_places_available) return;
    if(! modality) return;

    if(num_places_available[modality]) return num_places_available[modality];
  }

  const getParkedVehiclesForModality = (num_vehicles_available, modality) => {
    // Return nothing if no stop capacity was found
    if(! num_vehicles_available || num_vehicles_available.length === 0) return;
    // If it's a modality specific value: return value
    if(num_vehicles_available[modality]) return num_vehicles_available[modality];
  }

  const modalityNameToModalityTitle = (modalityName) => {
    if(modalityName === 'moped') return 'scooters';
    if(modalityName === 'bicycle') return 'fietsen';
    if(modalityName === 'cargo_bicycle') return 'bakfietsen';
    if(modalityName === 'car') return 'auto\'s';
    if(modalityName === 'other') return 'overige voertuigen';
  }

  const renderModalityRows = (stop) => {
    if(! stop) return;

    // Loop modalities
    let html = '';
    Object.keys(stop.realtime_data.num_places_available).forEach(modalityName => {
      const parkedVehiclesForModality = getParkedVehiclesForModality(stop.realtime_data.num_vehicles_available, modalityName);
      const capacityForModality = getCapacityForModality(stop.capacity, modalityName);
      const availableForModality = getAvailableForModality(stop.realtime_data.num_places_available, modalityName);
      // Don't show row if no relevant data is available
      if(! parkedVehiclesForModality && ! capacityForModality) return;

      const getDotColor = () => {
        if(availableForModality > 0) {
          return themes.zone.quiet.primaryColor;
        } else {
          return themes.zone.busy.primaryColor;
        }
      }

      return html += `<div class="flex my-1" style="min-width:180px">
        <div class="mr-2 flex justify-center flex-col">
          <div
            class="rounded-full w-3 h-3" style="background: ${getDotColor()}"
            title="${availableForModality > 0 ? `Open voor` : `Gesloten voor`} ${modalityNameToModalityTitle(modalityName)}"
          ></div>
        </div>
        <div class="mr-4 w-5">
          <img class="inline-block w-5" src="${getVehicleIconUrl(modalityName)}" alt="${modalityName}" style="max-width:none;" />
        </div>
        <div class="mr-2 flex justify-center flex-col">
          ${parkedVehiclesForModality
              ? parkedVehiclesForModality
              : '0'
            }${stop.capacity && stop.capacity.combined
            ? ''
            : capacityForModality ? `/${capacityForModality}` : ''
          }
        </div>
      </div>`
    });

    return html;
  }

  const renderParkedVehicles = (modality) => {
    return `<div>
      check: 14<br />
      felyx: 13<br />
      gosharing: 8<br />
    </div>`
  }

  const renderVisualIndicator = (numVehicles, numPlaces) => {
    if(! numVehicles) return '<div />';
    if(! numPlaces) return '<div />';

    // Calculate percentage
    const percentageOfVehiclesAvailable = parseInt(numVehicles/numPlaces*100);

    return `<div class="rounded-xl flex" style="background: #F6F5F4">
      <div class="rounded-l-xl font-bold py-1 px-2" style="background-color: ${getIndicatorColor(numVehicles, numPlaces)};min-width: ${percentageOfVehiclesAvailable > 100 ? 100 : percentageOfVehiclesAvailable}%">
        ${percentageOfVehiclesAvailable > 100 ? 100 : percentageOfVehiclesAvailable}%
      </div>
      <div class="flex-1" />
    </div>`
  }

  // num_places_available is het aantal beschikbare plkken
  const numPlacesAvailable = getNumPlacesAvailable(stop)
  // num_vehicles_available = Hoeveel voertuigen staan in dat gebied geparkeerd
  const numVehiclesAvailable = getNumVehiclesAvailable(stop.realtime_data)
  // Percentage
  const percentageOfVehiclesAvailable = numVehiclesAvailable/numPlacesAvailable*100;

  return `
    <div class="font-inter">
      <div class="text-lg font-bold">
        ${feature.properties.name}
      </div>
      <div class="mt-2 text-sm font-bold" ${isControlledAutomatically ? 'hidden' : ''} style="color:#15aeef;">
        Instelling actief: <b>altijd ${isManuallySetToOpen ? 'open' : 'gesloten'}</b>
      </div>
      <div class="mt-2 text-sm font-bold" ${(! numPlacesAvailable || isNaN(percentageOfVehiclesAvailable)) ? 'hidden' : ''}>
        Bezetting: ${numVehiclesAvailable}${isControlledAutomatically ? `/${numPlacesAvailable}` : ''}
      </div>
      <div class="mt-2 text-sm bg-green" ${(! numPlacesAvailable || isNaN(percentageOfVehiclesAvailable)) ? 'hidden' : ''}>
        ${renderVisualIndicator(numVehiclesAvailable, numPlacesAvailable)}
      </div>
      <div class="mt-4 text-sm">
        ${renderModalityRows(stop)}
      </div>
      <div class="mt-2 text-base" hidden>
        Scooter aanbieders:
      </div>
      <div hidden>
        ${renderParkedVehicles()}
      </div>
      <div class="mt-2 text-base" hidden>
        Andere aanbieders:
      </div>
      <div class="text-xs" hidden>
        (tellen niet mee voor capaciteit)
      </div>
      <div hidden>
        donkey: 25<br />
        htm: 4
      </div>
    </div>
  `
}

const initPublicZonesMap = async (theMap) => {
  if(! theMap) return;

  const publicZones = await fetchPublicZones();
  if(! publicZones) return;

  let geoJson = {
    "type":"FeatureCollection",
    "features":[]
  };

  publicZones.forEach(x => {
    geoJson.features.push(zoneToGeoJson(x));
  });

  // Check if the source exists
  if(! theMap.getSource('zones-metrics-public')) return;

  // Set geoJson data
  theMap.U.setData('zones-metrics-public', geoJson);

  // Show layer
  theMap.U.show('zones-metrics-public')

  theMap.on('click', 'zones-metrics-public', function (e) {
    // Don't show popup if it's a no_parking zone
    if(e && e.features && e.features[0]
         && e.features[0].properties && e.features[0].properties.geography_type
         && e.features[0].properties.geography_type === 'no_parking')
    {
      return;
    }

    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(generatePopupHtml(e.features[0]))
      .addTo(theMap);

    // Set page URL without reloading page
    const geographyId = e.features[0].properties.geography_id;
    setPublicZoneUrl(geographyId);
  });

  // Change the cursor to a pointer when the mouse is over the states layer.
  theMap.on('mouseenter', 'zones-metrics-public', function () {
    theMap.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  theMap.on('mouseleave', 'zones-metrics-public', function () {
    theMap.getCanvas().style.cursor = '';
  });
}

const initMapDrawLogic = (theMap) => {
  if(! theMap) return;

  // Don't init multiple times
  if(window.CROW_DD && window.CROW_DD.theDraw) return;

  // Set admin or public view if isAdminMode changed
  initAdminView(theMap)
}

const initAdminView = (theMap) => {
  // Add custom draw mode: 'StaticMode'
  // https://github.com/mapbox/mapbox-gl-draw-static-mode
  let modes = MapboxDraw.modes;
  modes = MapboxDrawWaypoint.enable(modes);// Di`sable moving features
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
    styles: [...publicStyles, ...adminStyles]
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
    // Get zoneId
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

const fetchAdminZones = async (token, filterGebied) => {
  if(! token) return;
  if(! filterGebied) return;

  const filter = {municipality: filterGebied}
  const zonesFromDb = await getAdminZones(token, filter);
  if(! zonesFromDb || zonesFromDb.message) return;
  let sortedZones = zonesFromDb.sort((a,b) => a.name.localeCompare(b.name));
  sortedZones = sortZonesInPreferedOrder(sortedZones)// Sort per geography_type
  return sortedZones;
}

const fetchPublicZones = async (filterGebied) => {
  const filter = filterGebied ? {municipality: filterGebied} : {}
  const zonesFromDb = await getPublicZones(filter);
  if(! zonesFromDb || zonesFromDb.message) return;
  let sortedZones = zonesFromDb.sort((a,b) => a.name.localeCompare(b.name));
  sortedZones = sortZonesInPreferedOrder(sortedZones)// Sort per geography_type
  return sortedZones;
}

// Color between green and red
const perc2color = (perc) => {
  var perc = 100 - perc;
  var r, g, b = 0;
  if(perc < 50) {
    r = 255;
    g = Math.round(5.1 * perc);
  }
  else {
    g = 255;
    r = Math.round(510 - 5.10 * perc);
  }
  var h = r * 0x10000 + g * 0x100 + b * 0x1;
  return '#' + ('000000' + h.toString(16)).slice(-6);
}

const calculateGradient = (number_of_vehicles, capacity) => {
  var ratio = Math.min(100.0, number_of_vehicles / capacity * 100);
  return perc2color(ratio);
}

const zoneToGeoJson = (adminZone) => {
  if(! adminZone) return;
  if(! adminZone.area || ! adminZone.area.geometry || ! adminZone.area.geometry.coordinates) return;

  const getColor = (stop) => {
    if(! stop) return 'transparent';

    const numPlacesAvailable = getNumPlacesAvailable(stop)
    const numVehiclesAvailable = getNumVehiclesAvailable(stop.realtime_data)

    return calculateGradient(numVehiclesAvailable, numPlacesAvailable)
  }

  const getBorderColor = (geography_type) => {
    if(! themes) return;
    if(! themes.zone) return;
    if(! themes.zone[geography_type]) return;
    return themes.zone[geography_type].primaryColor;
  }

  return {
    'id': adminZone.zone_id,
    'type': 'Feature',
    'properties': {
      zone_id: adminZone.zone_id,
      geography_id: adminZone.geography_id,
      geography_type: adminZone.geography_type,
      name: adminZone.name,
      stop: JSON.stringify(adminZone.stop),
      color: getColor(adminZone.stop),
      borderColor: getBorderColor(adminZone.geography_type),
      opacity: adminZone.geography_type === 'stop' ? 0.6 : 0.1
    },
    'geometry': adminZone.area.geometry
  }
}

const triggerGeographyClick = (geographyId, allZones) => {
  if(! window.CROW_DD) return;
  if(! window.CROW_DD.theDraw) return;
  if(! geographyId) return;
  if(! allZones) return;

  const zone = allZones.filter(x => {
    return x.geography_id === geographyId
  });

  const foundZone = zone && zone[0] ? zone[0] : false;
  if(! foundZone) return;

  // Check if feature exists
  const feature = window.CROW_DD.theDraw.get(foundZone.zone_id);
  // If it exists: select it
  if(feature) {
    window.CROW_DD.theDraw.changeMode('direct_select', {
      featureId: foundZone.zone_id
    });
  }
}

const openPopup = (theMap, foundZone) => {
  // https://stackoverflow.com/a/57533307
  // https://maplibre.org/maplibre-gl-js-docs/api/geography/#lnglat
  const location = center(foundZone.area);
  theMap.fire('click', {
    lngLat: new maplibregl.LngLat(location.geometry.coordinates[0], location.geometry.coordinates[1])
  });
  // TODO Make sure the correct layer is clicked on (i.e. monitoring, not no-parking)
  //      Info: https://github.com/mapbox/mapbox-gl-js/issues/9875
}

const navigateToGeography = (geographyId, allZones) => {
  if(! geographyId) {
    console.log('navigateToGeography :: No geographyId given');
    return;
  }
  if(! allZones) {
    console.log('navigateToGeography :: No allZones given');
    return;
  }

  const zone = allZones.filter(x => {
    return x.geography_id === geographyId
  });

  const foundZone = zone && zone[0] ? zone[0] : false;
  if(! foundZone) {
    console.log('navigateToGeography :: Zone not found :: Was searching for x.geography_id === geographyId', allZones, geographyId)
    return;
  }

  const st = require('geojson-bounds');

  // Navigate to zone / Zoom in into zone
  if(foundZone.area && foundZone.area.geometry && foundZone.area.geometry.coordinates && foundZone.area.geometry.coordinates[0]) {
    if(! window.ddMap) return;
    // Get extent
    const extent = st.extent(foundZone.area)
    // Delay it a little bit, so it comes after the
    // 'zoom in to extent' on filterGebied change/load
    setTimeout(x => {
      window.ddMap.fitBounds(extent, {
        padding: {
          top: 25,
          bottom: 25,
          left: window.innerWidth > 800 ? 350 : 25,
          right: 25
        },
        duration: 1.4*1000 // in ms
      });
      // Open popup for this polygon automatically
      setTimeout(() => {
        openPopup(window.ddMap, foundZone);
      }, 1500);
    }, 100);
  }

  return true;
}

export {
  initMapDrawLogic,
  getAdminZones,
  getPublicZones,
  initSelectToEdit,
  getZoneById,
  sortZonesInPreferedOrder,
  getLocalDrawsOnly,
  getDraftFeatureId,
  initPublicZonesMap,
  fetchAdminZones,
  fetchPublicZones,
  setPublicZoneUrl,
  setAdminZoneUrl,
  openPopup,
  navigateToGeography,
  triggerGeographyClick,
  getIndicatorColor,
  getNumVehiclesAvailable,
  getNumPlacesAvailable
}
