import vehiclesPoint from './vehicles-point.js';
import vehiclesHeatmapCityLevel from './vehicles-heatmap-city-level.js';
import vehiclesClusters from './vehicles-clusters.js';
import vehiclesClustersCount from './vehicles-clusters-count.js';
import vehiclesClustersPoint from './vehicles-clusters-point.js';

import rentalsOriginsPoint from './rentals-origins-point.js';
import rentalsOriginsHeatmapCityLevel from './rentals-origins-heatmap-city-level.js';
import rentalsOriginsClusters from './rentals-origins-clusters.js';
import rentalsOriginsClustersCount from './rentals-origins-clusters-count.js';
import rentalsOriginsClustersPoint from './rentals-origins-clusters-point.js';

import rentalsDestinationsPoint from './rentals-destinations-point.js';
import rentalsDestinationsHeatmapCityLevel from './rentals-destinations-heatmap-city-level.js';
import rentalsDestinationsClusters from './rentals-destinations-clusters.js';
import rentalsDestinationsClustersCount from './rentals-destinations-clusters-count.js';
import rentalsDestinationsClustersPoint from './rentals-destinations-clusters-point.js';

import zonesGeodata from './zones-geodata.js';

export const layers = {
  'vehicles-point': vehiclesPoint,
  'vehicles-clusters': vehiclesClusters,
  'vehicles-clusters-count': vehiclesClustersCount,
  'vehicles-clusters-point': vehiclesClustersPoint,
  'vehicles-heatmap-city-level': vehiclesHeatmapCityLevel,

  'rentals-origins-point': rentalsOriginsPoint,
  'rentals-origins-clusters': rentalsOriginsClusters,
  'rentals-origins-clusters-count': rentalsOriginsClustersCount,
  'rentals-origins-clusters-point': rentalsOriginsClustersPoint,
  'rentals-origins-heatmap-city-level': rentalsOriginsHeatmapCityLevel,

  'rentals-destinations-point': rentalsDestinationsPoint,
  'rentals-destinations-clusters': rentalsDestinationsClusters,
  'rentals-destinations-clusters-count': rentalsDestinationsClustersCount,
  'rentals-destinations-clusters-point': rentalsDestinationsClustersPoint,
  'rentals-destinations-heatmap-city-level': rentalsDestinationsHeatmapCityLevel,

  'zones-geodata': zonesGeodata
}
