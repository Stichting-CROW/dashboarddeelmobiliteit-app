const layer = {
  'id': 'rentals-origins-point',
  'type': 'symbol',
  'source': 'rentals-origins',
  'layout': {
    'icon-image': ["concat", ['get', 'system_id'], '-r:', ['get', 'distance_bin']],
    // 'icon-size': 0.4,
    'icon-size': [
      'interpolate',
        ['linear'],
        ['zoom'],
        11,
        0.1,
        16,
        0.5
      ],
    'icon-allow-overlap': true,
  },
}

export default layer;
