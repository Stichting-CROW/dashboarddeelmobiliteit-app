const layer = {
  'id': 'zones-metrics-public',
  'type': 'fill',
  'source': 'zones-metrics-public',
  'paint': {
    'fill-color': ['get', 'color'],
    'fill-opacity': ['get', 'opacity']
  },
}

export default layer;
