const layer = {
  'id': 'vehicles-point',
  'type': 'symbol',
  'source': 'vehicles',
  'layout': {
    'icon-image': ["concat", ['get', 'system_id'], '-p:', ['get', 'duration_bin']],
    // 'icon-size': 0.4,
    'icon-size': [
      'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0.2,
        16,
        0.7
      ],
    'icon-allow-overlap': true,
  },
  'minzoom': 6
}

export default layer;
