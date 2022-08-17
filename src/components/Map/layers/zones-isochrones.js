const layer = {
  'id': 'zones-isochrones',
  'type': 'fill',
  'source': 'zones-isochrones',
  'paint': {
    'fill-color': [
      'match', ['get','value'],
      60.0, '#15AEEF',
      120.0, '#15AEEF',
      180.0, '#15AEEF',
      300.0, '#15AEEF',
      '#15AEEF'
    ],
    'fill-opacity': [
      'match', ['get','value'],
      60.0, 0.4,
      120.0, 0.3,
      180.0, 0.2,
      300.0, 0.1,
      0.1
    ]
  },
}

export default layer;
