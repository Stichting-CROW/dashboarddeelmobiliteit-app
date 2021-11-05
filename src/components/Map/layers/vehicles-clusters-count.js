// Example code: https://maplibre.org/maplibre-gl-js-docs/example/cluster/
export default {
  'id': 'vehicles-clusters-count',
  'type': 'symbol',
  'source': 'vehicles-clusters',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
}
