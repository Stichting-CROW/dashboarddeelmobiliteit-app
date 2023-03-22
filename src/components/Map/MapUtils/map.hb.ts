import moment from 'moment';
import h3, {latLngToCell, polygonToCells} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions
import geojson2h3 from 'geojson2h3';
import maplibregl from 'maplibre-gl';
import center from '@turf/center'

type HexagonType = any;

const config = ({
  lng: -122.4,
  lat: 37.7923539,
  zoom: 11.5,
  fillOpacity: 0.6,
  colorScale: ['#ffffcc', '#78c679', '#006837']
})

const getColorStops = (maxCount, herkomstbestemming) => {
  if(! maxCount || maxCount <= 0) {
    return [
      [0, '#eee'],
      [100, '#eee']
    ];
  }

  // https://colorkit.co/color-shades-generator/006837/
  // coolors.co
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

// const exampleHexagons = {
//   '88283082a3fffff': 0.23360022663054658,
//   '88283082a1fffff': 0.5669828486310873
// }

const fetchHexagons = async (token: string, filter: any) => {
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
              `?h3_resolution=${filter.h3niveau}`+
              `&start_date=${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}`+
              `&end_date=${moment(filter.ontwikkelingtot).format('YYYY-MM-DD')}`+
              `&time_periods=${filter.timeframes}`+
              `&days_of_week=${filter.weekdays}`+
              `&modalities=${includedModalities}`+
              (filter.herkomstbestemming === 'bestemming'
                ? `&origin_cells=${filter.h3niveau === 7 ? filter.h3hexes7.join(',') : filter.h3hexes8.join(',')}`
                : `&destination_cells=${filter.h3niveau === 7 ? filter.h3hexes7.join(',') : filter.h3hexes8.join(',')}`)
  );

  let response, responseJson;

  try {
    response = await fetch(url, getFetchOptions());
    responseJson = await response.json();
  } catch(e) {
    console.error(e);
  }

  return responseJson;
}

const removeH3Grid = (map: any) => {
  let layer, key;
  let source, sourceId;
  
  key = 'h3-hexes';
  layer = map.getLayer(`${key}-layer`);
  source = map.getSource(key);
  if(layer) map.removeLayer(`${key}-layer`);
  if(source) map.removeSource(key);

  key = 'h3-hex-areas';
  layer = map.getLayer(`${key}-layer`);
  source = map.getSource(key);
  if(layer) map.removeLayer(`${key}-layer`);
  if(layer) map.removeSource(key);
}

const getH3Hexes = (filter) => {
  return (filter.h3niveau  && filter.h3niveau === 8) ? filter.h3hexes8 : filter.h3hexes7;
}

const getMaxCount = (hexagons: any) => {
  let maxCount: number = 0;
  Object.values(hexagons).forEach((x: number) => {
    if(x > maxCount) {
      maxCount = x;
    }
  });
  return maxCount;
} 

function renderHexes(map, hexagons, filter) {

  // Get selected h3 hexe(s) from state
  const selectedH3Hexes = getH3Hexes(filter);

  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    hex => {
      return {
        value: hexagons[hex],
        selected: selectedH3Hexes.indexOf(hex) > -1 ? 1 : 0
      }
    }
  );

  // Get highest hex value
  const maxCount: number = getMaxCount(hexagons);

  const sourceId = 'h3-hexes';
  let layerId = `${sourceId}-layer-fill`, source = map.getSource(sourceId);
  
  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
    });
    // Add hexes (fill + 1px outline)
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'fill',
      interactive: false,// <- What's this?
      paint: {
        // 'fill-outline-color': [
        //   'match', ['get', 'selected'],
        //   1, 'rgba(255,0,0,1)',
        //   'rgba(255,255,255,1)'
        // ]
      }
    });

    // Create hover effect (hovering fills)
    createHoverEffect(map, layerId, maxCount);

    // Set source variable
    source = map.getSource(sourceId);
  }
  // If source was already present: Update data
  else {
    // Update the geojson data
    source.setData(geojson);
  }
  
  // Update the layer paint properties, using the current config values
  // map.setPaintProperty(layerId, 'fill-color', {
  //   property: 'value',
  //   stops: [
  //    'case',
  //    ['boolean', ['feature-state', 'hover'], true],
  //    [[0, '#000'], [1, '#000']],
  //     getColorStops(maxCount)
  //   ]
  // });
  
  // Update the fill layer paint properties, using the current config values
  map.setPaintProperty(layerId, 'fill-color', {
    property: 'value',
    stops: getColorStops(maxCount, filter.herkomstbestemming)
    // stops: [
    //   [0, config.colorScale[0]],
    //   [50, config.colorScale[1]],
    //   [100, config.colorScale[2]]
    // ]
  });
  
  map.setPaintProperty(layerId, 'fill-opacity', config.fillOpacity);

  // Add line layer for wider outline/borders, on top of fill layer
  // Info here: https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness/50372832#50372832
  layerId = `${sourceId}-layer-border`;
  map.addLayer({
    id: layerId,
    source: sourceId,
    type: 'line',
    interactive: false,// <- What's this?
    paint: {
      'line-color': [
        'match', ['get', 'selected'],
        1, '#15aeef',
        '#fff'
      ],
      'line-width': [
        'match', ['get', 'selected'],
        1, 5,
        1
      ]
    }
  });

}

function renderAreas(map, hexagons, filter, threshold) {
  
  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeature(
    Object.keys(hexagons).filter(hex => hexagons[hex] > threshold)
  );
  
  const sourceId = 'h3-hex-areas';
  const layerId = `${sourceId}-layer`;
  let source = map.getSource(sourceId);

  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
    });
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'line',
      interactive: false,
      paint: {
        'line-width': 3,
        'line-color': (filter.herkomstbestemming === 'bestemming' ? '#F4010D' : config.colorScale[2]),
      }
    });
    source = map.getSource(sourceId);
  }

  // Update the geojson data
  source.setData(geojson);
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

const renderH3Grid = async (
  map: any,
  token: string,
  filter: any
) => {
  // Create placeholder variable
  let hexagonsAsArray = [];

  // Render grid for full map
  const h3HexesForViewport = getHexesForViewPort(map, filter)
  h3HexesForViewport.forEach((x) => {
    hexagonsAsArray[x] = 0;
  });

  // Render grid based on origins/destinations data
  const hexagonsResponse = await fetchHexagons(token, filter);
  if(! hexagonsResponse || ! hexagonsResponse.result) return;
  const hexagons = hexagonsResponse.result.destinations || hexagonsResponse.result.origins;

  hexagons.forEach((x: HexagonType) => {
    hexagonsAsArray[x.cell] = x.number_of_trips;
  })

  renderHexes(map, hexagonsAsArray, filter);
  // Render outline border
  renderAreas(map, hexagonsAsArray, filter, 0.75);
}

// Create a popup to be used on offer
const popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false
});

// https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/
// https://maplibre.org/maplibre-gl-js-docs/example/popup-on-hover/
const createHoverEffect = (map, layerId, maxCount) => {
  var hoveredStateId = null;

  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', layerId, function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    const coordinates = e.features[0].geometry.coordinates.slice();
    const percentage: number = e.features[0].properties.value / maxCount * 100;
    const description = `${e.features[0].properties.value} (${percentage.toFixed(1)}%)`;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    //   coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    // }

    const lngLat = e.lngLat;
    // console.log(e.features[0])
    // const lngLatCenter = center(e.features[0].geometry.coordinates);

    // Populate the popup and set its coordinates
    // based on the feature found.
    if(percentage > 0) {
      popup.setLngLat(lngLat).setHTML(description).addTo(map);
    }
  });
   
  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', layerId, function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
}

export {
  renderH3Grid,
  removeH3Grid
}
