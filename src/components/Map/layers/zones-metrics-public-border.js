const layer = {
  'id': 'zones-metrics-public-border',
  'type': 'line',
  'source': 'zones-metrics-public',
  'paint': {
    'line-color': ['get', 'borderColor'],
    'line-opacity': 0.6,
    'line-width': 2,
    'line-dasharray': [2, 2],
  },
}

export default layer;
