import vehiclesPoint from './vehicles-point.js';
import vehiclesHeatmap from './vehicles-heatmap.js';
import vehiclesHeatmapCityLevel from './vehicles-heatmap-city-level.js';
import vehiclesClusters from './vehicles-clusters.js';
import vehiclesClustersCount from './vehicles-clusters-count.js';
import vehiclesClustersPoint from './vehicles-clusters-point.js';
import zonesGeodata from './zones-geodata.js';

export const layers = {
  'vehicles-heatmap': vehiclesHeatmap,// Unused
  'vehicles-point': vehiclesPoint,
  'vehicles-clusters': vehiclesClusters,
  'vehicles-clusters-count': vehiclesClustersCount,
  'vehicles-clusters-point': vehiclesClustersPoint,
  'vehicles-heatmap-city-level': vehiclesHeatmapCityLevel,// Only one used
  'zones-geodata': zonesGeodata
}
