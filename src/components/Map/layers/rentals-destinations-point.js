const layer = {
  'id': 'rentals-destinations-point',
  'type': 'symbol',
  'source': 'rentals-destinations',
  'layout': {
    'icon-image': ["concat", ['get', 'system_id'], '-r:', ['get', 'distance_bin']],
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
}

export default layer;
