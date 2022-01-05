const layer = {
  'id': 'rentals-destinations-clusters-point',
  'type': 'symbol',
  'source': 'rentals-destinations',
  filter: ['!', ['has', 'point_count']],
  'layout': {
    'icon-image': ["concat", ['get', 'system_id'], ':', ['get', 'duration_bin']],
    'icon-size': 1,
    'icon-allow-overlap': true,
  },
  'minzoom': 18
}

export default layer;
