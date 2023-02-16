import h3 from 'h3-js';
import geojson2h3 from 'geojson2h3';

const hexagons = {
  '88283082a3fffff': 0.23360022663054658,
  '88283082a1fffff': 0.5669828486310873,
  '88283082a7fffff': 0.16348940282992852,
  '88283080c9fffff': 0.8581650719557958,
  '88283082b5fffff': 0.9915179087522776,
  '88283082bdfffff': 0.8601568910953867,
  '88283082abfffff': 0.9990917286546233,
  '88283082a9fffff': 0.6936182465426743,
  '88283082adfffff': 0.22605853878907167,
  '88283082a5fffff': 0.28965184204722316,
  '882830801bfffff': 0.9316964882818277,
  '88283080cdfffff': 0.3395771916473449,
  '88283080c1fffff': 0.3234869142715635,
  '88283080cbfffff': 0.7905099160859068,
  '88283082b7fffff': 0.9543175011653551,
  '88283082b1fffff': 0.806313865109527,
  '88283082b9fffff': 0.7731202839924824,
  '8828308287fffff': 0.252404486346119,
  '8828308285fffff': 0.2372100026389652,
  '88283082e3fffff': 0.7680129672955796,
  '88283082e7fffff': 0.14983712066613175,
  '882830805bfffff': 0.8470500978290958,
  '8828308053fffff': 0.030836579112298645,
  '8828308019fffff': 0.8057595572800851,
  '8828308011fffff': 0.5645131287768628,
  '8828308013fffff': 0.28724909913702823,
  '88283080c5fffff': 0.12399348928854792,
  '88283080c7fffff': 0.3645083957369952,
  '88283080c3fffff': 0.07714001150673044,
  '88283080ddfffff': 0.11198369519444906,
  '88283080d9fffff': 0.27195397510380626,
  '88283082b3fffff': 0.051271477750987504,
  '88283082bbfffff': 0.8370766187806946,
  '8828308295fffff': 0.6321431969968847,
  '8828308283fffff': 0.4010713180507681,
  '8828308281fffff': 0.5682559413869928,
  '882830828dfffff': 0.1804303945490413
}

const config = ({
  lng: -122.4,
  lat: 37.7923539,
  zoom: 11.5,
  fillOpacity: 0.6,
  colorScale: ['#ffffcc', '#78c679', '#006837']
})

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
    stops: [
      [0, config.colorScale[0]],
      [0.5, config.colorScale[1]],
      [1, config.colorScale[2]]
    ]
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

const renderH3Grid = (
  map: any
) => {

  console.log('renderH3Grid')

  renderHexes(map, hexagons);
  renderAreas(map, hexagons, 0.75);
}

export {
  renderH3Grid,
  removeH3Grid
}
