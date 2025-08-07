export const sources = {
  'vehicles': {
    'type': 'geojson',
  },
  'vehicles-clusters': {
    'type': 'geojson',
    'cluster': true,
    // 'clusterMaxZoom': 18,// Max zoom to cluster points on
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

  'zones-metrics-public': {
    'type': 'geojson',
  },

  'zones-isochrones': {
    'type': 'geojson',
  },
  'luchtfoto-pdok': {
    'type': 'raster',
    'tiles': ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.png'],
    'tileSize': 256,
    // 'minzoom': 12,
    'attribution': 'Kaartgegevens: <a href="https://www.pdok.nl/-/nu-hoge-resolutie-luchtfoto-2023-bij-pdok">PDOK</a>'
  },
}