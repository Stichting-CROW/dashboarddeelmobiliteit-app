// Example code: https://maplibre.org/maplibre-gl-js-docs/example/cluster/
const layer = {
  'id': 'vehicles-clusters',
  'type': 'circle',
  'source': 'vehicles-clusters',
  filter: ['has', 'point_count'],
  paint: {
    // Clusters that contain at least one own-area vehicle stay green.
    // Clusters with only public-context vehicles (Heel NL) are muted.
    'circle-color': [
      'case',
      ['<', ['get', 'context_count'], ['get', 'point_count']],
      '#1FA024',
      '#A8C9AA'
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20, 100,
      30, 750,
      40
    ]
  },
  'maxzoom': 12
}

export default layer;
