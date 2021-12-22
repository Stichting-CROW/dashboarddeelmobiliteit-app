export const sources = {
  'vehicles': {
    'type': 'geojson',
  },
  'vehicles-clusters': {
    'type': 'geojson',
    'cluster': true,
    // 'clusterMaxZoom': 17, // Max zoom to cluster points on
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },
  'rentals': {
    'type': 'geojson',
  },
}
