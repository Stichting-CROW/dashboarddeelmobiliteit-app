const layer = {
  'id': 'zones-metrics-public-border',
  'type': 'line',
  'source': 'zones-metrics-public',
  'paint': {
    'line-color': ['get', 'color'],
    'line-opacity': 0.6,
    'line-dasharray': [2, 2],
  },
}

export default layer;
