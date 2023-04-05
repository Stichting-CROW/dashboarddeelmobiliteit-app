import moment from 'moment';
import h3, {latLngToCell, polygonToCells} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions
import geojson2h3 from 'geojson2h3';
import maplibregl from 'maplibre-gl';
import center from '@turf/center'

import {
  abortableFetch
} from '../../../poll-api/pollTools.js';

type HexagonType = any;

const config = ({
  lng: -122.4,
  lat: 37.7923539,
  zoom: 11.5,
  fillOpacity: 0.6,
  colorScale: ['#ffffcc', '#78c679', '#006837']
})

// Variable that will prevent simultaneous loading of fetch requests
let theFetch = null;

const getColorStops = (maxCount, herkomstbestemming) => {
  if(! maxCount || maxCount <= 0) {
    return [
      [0, '#eee'],
      [100, '#eee']
    ];
  }

  // Create color gradient: coolors.co
  const colorScale = {
    green: [
      'rgba(255, 255, 255, 0)',// 0%
      '#78c679',               // 1-10%
      '#78c679',               // 10%
      '#6eb36f',               // 20%
      '#6eb36f',               // 30%
      '#519351',
      '#368937',               // 50%
      '#287929',
      '#186319',               // 70%
      '#0e500f',               // 80%
      '#052d06',               // 90%
      '#052d06'                // 100%
    ],
    red: [
      'rgba(255, 255, 255, 0)',// 0%
      '#FE7279',
      '#FD5D65',
      '#FD4952',
      '#FD353F',
      '#FD212C',
      '#FD0D19',
      '#F2020E',
      '#DE020D',
      '#CA020C',
      '#B6020B'
    ]
  }

  const colorKey = herkomstbestemming === 'bestemming' ? 'red' : 'green';

  const getColor = (perc) => {
    if(perc < 1) return colorScale[colorKey][0];
    if(perc < 10) return colorScale[colorKey][1];
    if(perc < 20) return colorScale[colorKey][2];
    if(perc < 30) return colorScale[colorKey][3];
    if(perc < 40) return colorScale[colorKey][4];
    if(perc < 50) return colorScale[colorKey][5];
    if(perc < 60) return colorScale[colorKey][6];
    if(perc < 70) return colorScale[colorKey][7];
    if(perc < 80) return colorScale[colorKey][8];
    if(perc < 90) return colorScale[colorKey][9];
    if(perc <= 100) return colorScale[colorKey][10];
  }

  let colorStops = [
    [0, getColor(0)]
  ];
  for(let i: number = (maxCount*0.1); i <= maxCount; i+=(maxCount*0.1)) {
    colorStops.push([i, getColor(i / maxCount * 100)])
  }

  return colorStops;
}

// Find symbol layer, so we can place layers below it (z-index)
// Source: https://maplibre.org/maplibre-gl-js-docs/example/geojson-layer-in-stack/
const findSymbolLayer = (map) => {
  var layers = map.getStyle().layers;
  // Find the index of the first symbol layer in the map style
  var firstSymbolId;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
      firstSymbolId = layers[i].id;
      break;
    }
  }
  return '';// Disable
  return firstSymbolId;
}

// const exampleHexagons = {
//   '88283082a3fffff': 0.23360022663054658,
//   '88283082a1fffff': 0.5669828486310873
// }

const fetchHbData = async (token: string, filter: any) => {
  // Abort previous fetch
  if(theFetch) {
    theFetch.abort()
  }

  const getFetchOptions = () => {
    return {
      headers: {
        "authorization": `Bearer ${token}`,
        'mode':'no-cors'
      }
    }
  }

  // Get the modalities that are active
  const allModalities = ['cargo_bicycle', 'moped', 'bicycle', 'car', 'unknown'];
  const excludedModalities = filter.voertuigtypesexclude;
  const includedModalities = allModalities.filter(x => excludedModalities.split(',').indexOf(x) <= -1);

  // Get API response
  const url = encodeURI(`https://api.deelfietsdashboard.nl/od-api/${filter.herkomstbestemming === 'bestemming' ? 'destinations' : 'origins'}/h3`+
              `?h3_resolution=${filter.h3niveau || 8}`+
              `&start_date=${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}`+
              `&end_date=${moment(filter.ontwikkelingtot).format('YYYY-MM-DD')}`+
              `&time_periods=${filter.timeframes || '6-10,10-14,14-18,18-22,22-2,2-6'}`+
              `&days_of_week=${filter.weekdays || 'fr,th,mo,tu,we,sa,su'}`+
              `&modalities=${includedModalities}`+
              (filter.herkomstbestemming === 'bestemming'
                ? `&origin_cells=${filter.h3niveau === 7 ? filter.h3hexes7.join(',') : filter.h3hexes8.join(',')}`
                : `&destination_cells=${filter.h3niveau === 7 ? filter.h3hexes7.join(',') : filter.h3hexes8.join(',')}`)
  );

  let response, responseJson;

  try {
    // Do a fetch
    theFetch = abortableFetch(url, getFetchOptions());
    const response = await theFetch.ready;
    // Set theFetch to null, so next request is not aborted
    theFetch = null;
    // Get response JSON
    responseJson = await response.json();
  } catch(e) {
    console.error(e);

    // Set theFetch to null, so next request is not aborted
    theFetch = null;
  }

  return responseJson;
}

const removeH3Sources = (map: any) => {
  let layer;
  let key, source;
  
  key = 'h3-hexes';
  source = map.getSource(key);
  if(source) map.removeSource(key);

  key = 'h3-hex-areas';
  source = map.getSource(key);
  if(source) map.removeSource(key);
}

const removeH3Grid = (map: any) => {
  let layer, key;
  let source;
  
  key = 'h3-hexes-layer-fill';
  layer = map.getLayer(`${key}`);
  if(layer) map.removeLayer(`${key}`);
  
  key = 'h3-hexes-layer-border';
  layer = map.getLayer(`${key}`);
  if(layer) map.removeLayer(`${key}`);

  key = 'h3-hexes';
  layer = map.getLayer(`${key}-layer`);
  source = map.getSource(key);
  if(layer) map.removeLayer(`${key}-layer`);

  key = 'h3-hex-areas';
  layer = map.getLayer(`${key}-layer`);
  source = map.getSource(key);
  if(layer) map.removeLayer(`${key}-layer`);

  removeH3Sources(map);
}

const getH3Hexes = (filter) => {
  return (filter.h3niveau  && filter.h3niveau === 8) ? filter.h3hexes8 : filter.h3hexes7;
}

const getAggregatedStats = (geojson: any) => {
  let maxCount: number = 0;
  let sumCount: number = 0;
  Object.values(geojson.features).forEach((x: any) => {
    const value = x.properties.value;
    sumCount += value;
    if(value > maxCount) {
      maxCount = value;
    }
  });
  return {
    maxCount: maxCount,
    sumCount: sumCount
  };
} 

async function renderPolygons_fill(map, geojson, filter) {
  // Get highest hex value
  const {maxCount, sumCount} = getAggregatedStats(geojson);

  const sourceId = 'h3-hexes';
  let layerId = `${sourceId}-layer-fill`
    , source = map.getSource(sourceId);
  const layer = map.getLayer(layerId)

  // Add the source if we haven't created them yet
  if (! source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      generateId: true // This ensures that all features have unique IDs
    });

    // Set source variable
    source = map.getSource(sourceId);
  }
  if (! layer) {
    // Add hexes (fill + 1px outline)
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'fill',
      // interactive: false,// <- What's this?
    }, findSymbolLayer(map));
  }
  // If source was already present: Update data
  else {
    // Update the geojson data
    source.setData(geojson);
  }
  
  // Update the fill layer paint properties, using the current config values
  map.setPaintProperty(layerId, 'fill-color', {
    property: 'value',
    stops: getColorStops(maxCount, filter.herkomstbestemming)
  });
  
  // Set opacity
  map.setPaintProperty(layerId, 'fill-opacity', config.fillOpacity);

  // Add line layer for wider outline/borders, on top of fill layer
  // Info here: https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness/50372832#50372832
  layerId = `${sourceId}-layer-border`;
  map.addLayer({
    id: layerId,
    source: sourceId,
    type: 'line',
    // interactive: true,// <- What's this?
    paint: {
      'line-color': [
        "case",
        ["==", ["get", "selected"], 1], '#15aeef',
        ["boolean", ["feature-state", "hover"], false], '#666',
        '#DDD'
      ],
      'line-width': [
        "case",
        ["==", ["get", "selected"], 1], 5,
        ["boolean", ["feature-state", "hover"], false], 2,
        1
      ]
    }
  }, findSymbolLayer(map));

  // Create hover effect (hovering fills)
  createHoverEffect(map, 'h3-hexes-layer-fill', maxCount, sumCount);
}

function renderPolygons_border(map, geojson, filter) {
 
  const sourceId = 'h3-hex-areas';
  const layerId = `${sourceId}-layer`;
  let source = map.getSource(sourceId);

  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      generateId: true
    });
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'line',
      // interactive: false,
      paint: {
        'line-width': 3,
        'line-color': [
          "case",
          ["==", ["get", "selected"], 1], '#15aeef',
          ["boolean", ["feature-state", "hover"], false], '#666',
          (filter.herkomstbestemming === 'bestemming' ? '#F4010D' : config.colorScale[2])
        ]
      }
    }, findSymbolLayer(map));
    source = map.getSource(sourceId);
  }
  // Update paint properties as well if source was available already
  else {
    map.setPaintProperty(layerId, 'line-color', [
      "case",
      ["==", ["get", "selected"], 1], '#15aeef',
      ["boolean", ["feature-state", "hover"], false], '#666',
      (filter.herkomstbestemming === 'bestemming' ? '#F4010D' : config.colorScale[2])
    ]);
  }

  // Update the geojson data
  source.setData(geojson);
}
function renderPercentageValues(map, geojson, filter) {
  const sourceId = 'h3-hexes';
  const layerId = `${sourceId}-percentageValues-layer`;

  map.addLayer({
    "id": layerId,
    "type": "symbol",
    "source": sourceId,
    "minzoom": 11,
    "layout": {
      'text-field': ["case",
        [">", ["get", "value"], 0], ['get', 'value'], ""
      ],
      "text-font": [
        "DIN Offc Pro Medium",
        "Arial Unicode MS Bold"
      ],
      "text-size": 12,
      // 'text-offset': [0, 1.25],
      // 'text-anchor': 'top'
    }
  });
}

// Get hexes for map viewport
const getHexesForViewPort = (map, filter) => {
  // If zoom level is less than 9, don't render hex grid for viewport
  // (because otherwise it's to resourcefull)
  if(map.getZoom() < 9) return [];

  const { _sw: sw, _ne: ne} = map.getBounds();
  const boundsPolygon =[
      [ sw.lat, sw.lng ],
      [ ne.lat, sw.lng ],
      [ ne.lat, ne.lng ],
      [ sw.lat, ne.lng ],
      [ sw.lat, sw.lng ],
  ];
  const hexes = polygonToCells(boundsPolygon, filter.h3niveau);

  return hexes;
}

// Get hexes for user
const getHexesForUser = async (map, token, filter) => {
  // Get hexes user has access to
  const url = encodeURI(`https://api.dashboarddeelmobiliteit.nl/od-api/accessible/h3?h3_resolution=8${filter.gebied ? '&filter_municipalities=' + filter.gebied : ''}`);

  let responseJson;

  try {
    let response = await fetch(url, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${token}`
      }
    });
    responseJson = await response.json();
  } catch(e) {
    console.error(e);
  }

  // Validate
  if(! responseJson || ! responseJson.result) {
    console.error('No valid response json returned for getting accessible h3 hexes')
    return;
  }

  // If user has access to everything: Only get h3 hexes for viewport
  if(responseJson.result.all_accessible === true) {
    const h3HexesForViewport = getHexesForViewPort(map, filter);
    return h3HexesForViewport;
  }

  // Otherwise: Return all hexes available for user
  return responseJson.result.accessible_h3_cells;
}

const createFeatureCollection = async (map, token, filter, threshold) => {
  // Create placeholder variable
  let hexagonsAsArray = [];

  // Render grid for full map
  const h3HexesForUser = await getHexesForUser(map, token, filter)
  h3HexesForUser.forEach((x) => {
    hexagonsAsArray[x] = 0;
  });

  // Render grid based on origins/destinations data
  const hexagonsResponse = await fetchHbData(token, filter);
  if(! hexagonsResponse || ! hexagonsResponse.result) return;
  const hexagons = hexagonsResponse.result.destinations || hexagonsResponse.result.origins;

  hexagons.forEach((x: HexagonType) => {
    hexagonsAsArray[x.cell] = x.number_of_trips;
  });

  // Get selected h3 hexe(s) from state
  const selectedH3Hexes = getH3Hexes(filter);

  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagonsAsArray),
    hex => {
      return {
        value: hexagonsAsArray[hex],
        selected: selectedH3Hexes.indexOf(hex) > -1 ? 1 : 0
      }
    }
  );

  // Transform the current hexagon map into a GeoJSON object
  const geojsonForOuterBorder = geojson2h3.h3SetToFeature(
    Object.keys(hexagonsAsArray).filter(hex => hexagonsAsArray[hex] > threshold)
  );

  return {
    geojson,
    geojsonForOuterBorder
  };
}

const renderH3Grid = async (
  map: any,
  token: string,
  filter: any
) => {
  // Remove old H3 sources first
  removeH3Sources(map);
  // Get feature collection based on OD data
  const featureCollectionResponse = await createFeatureCollection(map, token, filter, 0.75);
  const geojson = featureCollectionResponse.geojson;
  const geojsonForOuterBorder = featureCollectionResponse.geojsonForOuterBorder;

  // Render hexes
  renderPolygons_fill(map, geojson, filter);
  // Render outline border
  renderPolygons_border(map, geojsonForOuterBorder, filter);
  // Render percentages inside the polygons
  renderPercentageValues(map, geojson, filter);
}

// Create a popup to be used on offer
const popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false
});

// https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/
// https://maplibre.org/maplibre-gl-js-docs/example/popup-on-hover/
const createHoverEffect = (map, layerId, maxCount, sumCount) => {
  var hoveredStateId = null;

  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', layerId, function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    const coordinates = e.features[0].geometry.coordinates.slice();
    const percentageColorFill: number = e.features[0].properties.value / maxCount * 100;
    const percentageOfTotal: number = e.features[0].properties.value / sumCount * 100;
    // sumCount
    const description = `${e.features[0].properties.value} (${percentageOfTotal.toFixed(1)}%)`;
    const lngLat = e.lngLat;

    // Populate the popup and set its coordinates
    // based on the feature found.
    if(percentageColorFill > 0) {
      popup.setLngLat(lngLat).setHTML(description).addTo(map);
    }

    if (hoveredStateId) {
      map.setFeatureState(
        { source: 'h3-hexes', id: hoveredStateId },
        { hover: false }
      );
      map.setFeatureState(
        { source: 'h3-hex-areas', sourceLayer: 'h3-hex-areas-layer', id: hoveredStateId },
        { hover: false }
      );
    }

    // Set 'hover' flag
    hoveredStateId = e.features[0].id;
    map.setFeatureState(
      { source: 'h3-hexes', id: hoveredStateId },
      { hover: true }
    );
    map.setFeatureState(
      { source: 'h3-hex-areas', sourceLayer: 'h3-hex-areas-layer', id: hoveredStateId },
      { hover: true }
    );
  });
   
  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', layerId, function () {
    map.getCanvas().style.cursor = '';
    popup.remove();

    // Unhover
    if (hoveredStateId) {
      map.setFeatureState(
        { source: 'h3-hexes', id: hoveredStateId },
        { hover: false }
      );
      map.setFeatureState(
        { source: 'h3-hex-areas', sourceLayer: 'h3-hex-areas-layer', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
  });
}

export {
  removeH3Sources,
  fetchHbData,
  renderH3Grid,
  removeH3Grid,
  renderPolygons_fill,
  renderPolygons_border,
  renderPercentageValues
}
