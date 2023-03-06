import moment from 'moment';
import h3, {latLngToCell} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions
import geojson2h3 from 'geojson2h3';

type HexagonType = any;

const getColorStops = (maxCount) => {
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

const exampleHexagons = {
  '88283082a3fffff': 0.23360022663054658,
  '88283082a1fffff': 0.5669828486310873
}

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

function renderHexes(map, hexagons) {
  
  // Transform the current hexagon map into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagons),
    hex => ({value: hexagons[hex]})
  );

  let maxCount: number = 0;
  Object.values(hexagons).forEach((x: number) => {
    if(x > maxCount) {
      maxCount = x;
    }
  });

  const sourceId = 'h3-hexes';
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
      type: 'fill',
      interactive: false,
      paint: {
        'fill-outline-color': 'rgba(0,0,0,0)',
      }
    });
    source = map.getSource(sourceId);
  }

  // Update the geojson data
  source.setData(geojson);
  
  // Update the layer paint properties, using the current config values
  map.setPaintProperty(layerId, 'fill-color', {
    property: 'value',
    stops: getColorStops(maxCount)
  });
  
  map.setPaintProperty(layerId, 'fill-opacity', config.fillOpacity);
}

function renderAreas(map, hexagons, threshold) {
  
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
        'line-color': config.colorScale[2],
      }
    });
    source = map.getSource(sourceId);
  }

  // Update the geojson data
  source.setData(geojson);
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

  renderHexes(map, hexagonsAsArray);
  renderAreas(map, hexagonsAsArray, 0.75);
}

export {
  renderH3Grid,
  removeH3Grid
}
