// Example code: https://maplibre.org/maplibre-gl-js-docs/example/cluster/
const layer = {
  'id': 'vehicles-clusters',
  'type': 'circle',
  'source': 'vehicles-clusters',
  filter: ['has', 'point_count'],
  paint: {
    // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
    // with three steps to implement three types of circles:
    //   * Blue, 20px circles when point count is less than 100
    //   * Yellow, 30px circles when point count is between 100 and 750
    //   * Pink, 40px circles when point count is greater than or equal to 750
    'circle-color': '#1FA024',
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20, 100,
      30, 750,
      40
    ]
  },
  'maxzoom': 18
}

export default layer;
