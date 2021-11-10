// Example code: https://maplibre.org/maplibre-gl-js-docs/example/cluster/
const layer = {
  'id': 'vehicles-clusters-point',
  'type': 'circle',
  'source': 'vehicles-clusters',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 4,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }
}

export default layer;
