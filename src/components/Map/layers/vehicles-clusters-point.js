const layer = {
  'id': 'vehicles-clusters-point',
  'type': 'symbol',
  'source': 'vehicles',
  filter: ['!', ['has', 'point_count']],
  'layout': {
    'icon-image': ["concat", ['get', 'system_id'], ':', ['get', 'duration_bin']],
    'icon-size': 1,
    'icon-allow-overlap': true,
  },
  'minzoom': 18
}

export default layer;
