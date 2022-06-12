const layer = {
  'id': 'zones-metrics-public-border',
  'type': 'line',
  'source': 'zones-metrics-public',
  'paint': {
    'line-color': ['get', 'borderColor'],
    'line-opacity': 0.6,
    // Bigger line-width if zoomed out
    'line-width': [
      'interpolate',
      ['linear'],
      ['zoom'],
      2,// Zoom level 2
      4,// Line width 8
      16,// Zoom level 16
      2// Line width 2
    ],
    'line-dasharray': [2, 2],
  },
}

export default layer;
