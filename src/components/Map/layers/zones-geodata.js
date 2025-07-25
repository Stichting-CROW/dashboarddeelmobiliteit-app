const layer = {
  'id': 'zones-geodata',
  'type': 'fill',
  'source': 'zones-geodata',
  'minzoom': 0,
  'layout': {
    'visibility': 'visible'
  },
  'paint': {
    'fill-color': '#d1d1e8',
    'fill-opacity': 0.3
  },
}

// 'filter': ['==', '$type', 'MultiPolygon'],
// 'minzoom': 1,

export default layer;