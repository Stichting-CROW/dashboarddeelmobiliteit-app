export const sources = {
  'vehicles': {
    'type': 'geojson',
  },
  'vehicles-clusters': {
    'type': 'geojson',
    'cluster': true,
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },
  'vehicles-heatmap': {
    'type': 'geojson'
  },

  'rentals-origins': {
    'type': 'geojson',
  },
  'rentals-origins-clusters': {
    'type': 'geojson',
    'cluster': true,
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },
  'rentals-origins-heatmap': {
    'type': 'geojson',
  },

  'rentals-destinations': {
    'type': 'geojson',
  },
  'rentals-destinations-clusters': {
    'type': 'geojson',
    'cluster': true,
    'clusterRadius': 50 // Radius of each cluster when clustering points (defaults to 50)
  },
  'rentals-destinations-heatmap': {
    'type': 'geojson',
  },

  'zones-geodata': {
    'type': 'geojson',
  },
}
