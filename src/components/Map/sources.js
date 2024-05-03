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
  // 'luchtfoto-pdok': {
  //   "type": "raster",
  //   "tiles": [
  //       "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/2022_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg"
  //   ],
  //   "bbox": [
  //       -1.6572915949804234,
  //       48.04050184534028,
  //       12.431727349396443,
  //       56.11058967063549
  //   ],
  //   "minzoom": 6,
  //   "maxzoom": 16,
  //   "tileSize": 256
  // },
  // 'brt-achtergrondkaart': {
  //   'type': 'raster',
  //   'tiles': ['https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png'],
  //   'tileSize': 256,
  //   'minzoom': 5,
  //   'maxzoom': 17,
  //   'attribution': 'Kaartgegevens: <a href="https://kadaster.nl">Kadaster</a>'
  // },
  'luchtfoto-pdok': {
    'type': 'raster',
    'tiles': ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.png'],
    'tileSize': 256,
    'minzoom': 12,
    'attribution': 'Kaartgegevens: <a href="https://www.pdok.nl/-/nu-hoge-resolutie-luchtfoto-2023-bij-pdok">PDOK</a>'
  },
}
