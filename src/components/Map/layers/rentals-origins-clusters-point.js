const layer = {
  'id': 'rentals-origins-clusters-point',
  'type': 'symbol',
  'source': 'rentals-origins',
  filter: ['!', ['has', 'point_count']],
  'layout': {
    'icon-image': ["concat", ['get', 'system_id'], ':', ['get', 'duration_bin']],
    'icon-size': 1,
    'icon-allow-overlap': true,
  },
  'minzoom': 18
}

export default layer;
