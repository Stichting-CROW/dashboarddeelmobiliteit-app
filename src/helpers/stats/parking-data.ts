import moment from 'moment-timezone';
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
  downloadCsv,
  keepActiveOperators
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

export const getAggregatedChartData = (vehiclesData, filter, zones, aanbieders) => {
  let dataset;
  if(doShowDetailledAggregatedData(filter, zones)) {
    dataset = prepareAggregatedStatsData_timescaleDB('available_vehicles', vehiclesData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude)
  } else {
    dataset = prepareAggregatedStatsData('available_vehicles', vehiclesData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude)
  }
  
  // Filter out operators that are not active
  return keepActiveOperators(dataset, aanbieders);
}

export const getTotalsPerHour = (data: Object[]) => {
  return data.map(timeIntervalData => {
    let totalVehiclesForTimeInterval = 0, time;
    Object.keys(timeIntervalData).forEach(key => {
      if(key === 'time') {
        // Get the time
        time = timeIntervalData[key];
        // Do not continue as there's nothing to count
        return;
      }
      // Increment total vehicles count
      totalVehiclesForTimeInterval += timeIntervalData[key];
    })
    return {
      time: time,
      total: Math.round(totalVehiclesForTimeInterval)
    }
  });
}

export const getSummedTotalsPerWeekdayAndHour = (data: object) => {
  let aggregatedTotals: any[] = [], countedDays: any[] = [];
  // Loop all data rows and group per weekday and time
  for(let key in data) {
    // Get weekday: 0 = Sunday, 1 = Monday
    let weekDay = moment.tz(data[key].time, 'Europe/Amsterdam').day();
    // Transfer Sunday=0 to Sunday=7
    if(weekDay === 0) {
      weekDay = 7;
    }
    // Keep track of the amount of weekDays we processed
    // console.log('countedDays for ', weekDay, countedDays['day-'+weekDay])
    countedDays['day-'+weekDay] = countedDays['day-'+weekDay] ? countedDays['day-'+weekDay]+1 : 1;
    // Get hour
    const hour = moment.tz(data[key].time, 'Europe/Amsterdam').hour();
    // Store in array
    if(aggregatedTotals[`day-${weekDay}`] === undefined) {
      aggregatedTotals[`day-${weekDay}`] = [];
      aggregatedTotals[`day-${weekDay}`][`hour-${hour}`] = data[key].total;
    }
    else if(aggregatedTotals[`day-${weekDay}`][`hour-${hour}`] === undefined) {
      aggregatedTotals[`day-${weekDay}`][`hour-${hour}`] = data[key].total;
    }
    else {
      aggregatedTotals[`day-${weekDay}`][`hour-${hour}`] += data[key].total;
    }
  }
  // Correct for duplicate days
  // console.log('countedDays', countedDays);
  [1,2,3,4,5,6,7].forEach(day => {
    // console.log('day', day);
    // console.log('counted days', day, countedDays['day-'+day])
    if(countedDays['day-'+day] <= 1) return;
    // aggregatedTotals['day-'+day].forEach(hour => {
    //   console.log('hour', hour)
    // })
  });
  return aggregatedTotals;
}