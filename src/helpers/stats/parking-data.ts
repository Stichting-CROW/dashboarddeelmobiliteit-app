import {getAggregatedStats, getAggregatedStats_timescaleDB} from '../../api/aggregatedStats';

import {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  sumAggregatedStats,
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone,
  aggregationFunctionButtonsToRender,
  getDateFormat,
  prepareDataForCsv,
  downloadCsv
} from './index';

export const getAggregatedVehicleData = async (token, filter, zones, metadata) => {
  let aggregatedVehicleData;
  const options = {
    filter: filter,
    metadata: metadata,
    aggregationLevel: filter.ontwikkelingaggregatie,
    aggregationTime: filter.ontwikkelingaggregatie_tijd,
    aggregationFunction: filter.ontwikkelingaggregatie_function
  }
  if(doShowDetailledAggregatedData(filter, zones)) {
    aggregatedVehicleData = await getAggregatedStats_timescaleDB(token, 'available_vehicles', options);
  } else {
    aggregatedVehicleData = await getAggregatedStats(token, 'available_vehicles', options);
  }

  // Return if no stats are available
  if(! aggregatedVehicleData || (! aggregatedVehicleData.availability_stats && ! aggregatedVehicleData.available_vehicles_aggregated_stats)) {
    return;
  }

  return aggregatedVehicleData;
}

export const getAggregatedChartData = (vehiclesData, filter, zones) => {
  if(doShowDetailledAggregatedData(filter, zones)) {
    return prepareAggregatedStatsData_timescaleDB('available_vehicles', vehiclesData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude)
  } else {
    return prepareAggregatedStatsData('available_vehicles', vehiclesData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude)
  }
}