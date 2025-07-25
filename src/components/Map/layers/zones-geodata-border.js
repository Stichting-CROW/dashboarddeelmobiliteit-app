const layer = {
  'id': 'zones-geodata-border',
  'type': 'line',
  'source': 'zones-geodata',
  'minzoom': 0,
  'layout': {
    'visibility': 'visible'
  },
  'paint': {
    'line-color': '#001299',
    'line-opacity': 0.6,
    'line-dasharray': [2, 2],
  },
}

export default layer;