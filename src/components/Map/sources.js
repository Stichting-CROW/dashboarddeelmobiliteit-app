export const sources = {
  'vehicles': {
    'type': 'geojson',
  },
  'vehicles-clusters': {
    'type': 'geojson',
    'cluster': true,
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },

  'rentals-origins': {
    'type': 'geojson',
  },
  'rentals-origins-clusters': {
    'type': 'geojson',
    'cluster': true,
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },

  'rentals-destinations': {
    'type': 'geojson',
  },
  'rentals-destinations-clusters': {
    'type': 'geojson',
    'cluster': true,
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },
}
