import moment from 'moment';
import h3, {latLngToCell} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions
import geojson2h3 from 'geojson2h3';

type HexagonType = any;

const getColorStops = (maxCount) => {
  if(! maxCount || maxCount <= 0) {
    return [
      [0, '#eee'],
      [100, '#eee']
    ];
  }

  const colorScale = [
    '#ffffff',
    '#ffffcc',
    '#78c679',
    '#78c679',
    '#78c679',
    '#78c679',
    '#006837',
    '#006837',
    '#006837',
    '#006837'
  ];

  const getColor = (perc) => {
    if(perc < 10) return colorScale[0];
    if(perc < 20) return colorScale[1];
    if(perc < 30) return colorScale[2];
    if(perc < 40) return colorScale[3];
    if(perc < 50) return colorScale[4];
    if(perc < 60) return colorScale[5];
    if(perc < 70) return colorScale[6];
    if(perc < 80) return colorScale[7];
    if(perc < 90) return colorScale[8];
    if(perc <= 100) return colorScale[9];
  }

  let colorStops = [];
  for(let i: number = 0; i <= maxCount; i+=(maxCount*0.1)) {
    colorStops.push([i, getColor(i / maxCount * 100)])
  }

  return colorStops;
}

// const exampleHexagons = {
//   '88283082a3fffff': 0.23360022663054658,
//   '88283082a1fffff': 0.5669828486310873
// }

const config = ({
  lng: -122.4,
  lat: 37.7923539,
  zoom: 11.5,
  fillOpacity: 0.6,
  colorScale: ['#ffffcc', '#78c679', '#006837']
})

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
                ? `&origin_cells=${filter.h3niveau === 7 ? filter.h3hexes7 : filter.h3hexes8}`
                : `&destination_cells=${filter.h3niveau === 7 ? filter.h3hexes7 : filter.h3hexes8}`)
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

function renderHexes(map, hexagons, filter) {

  // Get selected h3 hexe(s) from state
  const selectedH3Hexes = getH3Hexes(filter);

  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    hex => {
      return {
        value: hexagons[hex],
        selected: hex === selectedH3Hexes ? 1 : 0
      }
    }
  );

  // Get highest hex value
  let maxCount: number = 0;
  Object.values(hexagons).forEach((x: number) => {
    if(x > maxCount) {
      maxCount = x;
    }
  });

  const sourceId = 'h3-hexes';
  let layerId, source = map.getSource(sourceId);
  
  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
    });
    // Add hexes (fill + 1px outline)
    layerId = `${sourceId}-layer-fill`;
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

    // Set source variable
    source = map.getSource(sourceId);
  }

  // createHoverEffect(map, layerId);

  // Update the geojson data
  source.setData(geojson);
  
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
    stops: getColorStops(maxCount)
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

const renderH3Grid = async (
  map: any,
  token: string,
  filter: any
) => {

  const hexagonsResponse = await fetchHexagons(token, filter);
  if(! hexagonsResponse || ! hexagonsResponse.result) return;
  const hexagons = hexagonsResponse.result.destinations || hexagonsResponse.result.origins;

  let hexagonsAsArray = [];

  hexagons.forEach((x: HexagonType) => {
    hexagonsAsArray[x.cell] = x.number_of_trips;
  })

  renderHexes(map, hexagonsAsArray, filter);
}

// https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/
const createHoverEffect = (map, layerId) => {
  var hoveredStateId = null;

  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', layerId, function (e) {
    if (e.features.length > 0) {
      if (hoveredStateId) {
        map.setFeatureState(
          { source: 'states', id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = e.features[0].id;
      map.setFeatureState(
        { source: 'states', id: hoveredStateId },
        { hover: true }
      );
    }
  });
   
  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', layerId, function () {
    if (hoveredStateId) {
      map.setFeatureState(
        { source: 'states', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
  });
}

export {
  renderH3Grid,
  removeH3Grid
}
