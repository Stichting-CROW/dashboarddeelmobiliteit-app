// Example code: https://maplibre.org/maplibre-gl-js-docs/example/cluster/
const layer = {
  'id': 'vehicles-clusters-count',
  'type': 'symbol',
  'source': 'vehicles-clusters',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': [
      'step',
      ['get', 'point_count'],
      16, 100,
      20, 750,
      30
    ]

  },
  paint: {
    'text-color': '#fff',
    // 'text-halo-color': '#fff',
    // 'text-halo-width': 2
  },
  'maxzoom': 18
}

export default layer;
