import moment from 'moment-timezone';
import {archivedProviders} from './providers.js';

import {
  getZoneById,
} from '../components/Map/MapUtils/zones.js';

const getDateFormat = (aggregationLevel) => {
  if(aggregationLevel === '5m') {
    return 'DD/MM HH:mm';
  }
  if(aggregationLevel === '15m') {
    return 'DD/MM HH:mm';
  }
  else if(aggregationLevel === 'hour') {
    return 'DD/MM HH:ss';
  }
  else if(aggregationLevel === 'day') {
    return 'DD MMM YYYY';
  }
  else if(aggregationLevel === 'week') {
    return '[w]W, YYYY';
  }
  else if(aggregationLevel === 'month') {
    return 'MMM YYYY';
  }
}

const didSelectAtLeastOneCustomZone = (filter, zones) => {
  let userDidSelectCustomZone = false;
  if(zones && filter.zones && filter.zones.split(',').length > 0) {
    // Get first zone from selected zones
    const foundZone = getZoneById(zones, Math.abs(filter.zones.split(',')[0]));
    if(foundZone && foundZone.zone_type === 'custom') {
      userDidSelectCustomZone = true;
    }
  }
  return userDidSelectCustomZone;
}

// We show detailled aggregated data if:
// - Date is >= 2022-11
// - At least 1 zone is selected
const doShowDetailledAggregatedData = (filter, zones) => {
  // Get zone info from database
  const userDidSelectCustomZone = didSelectAtLeastOneCustomZone(filter, zones);
  // Return
  return moment(filter.ontwikkelingvan).unix() >= moment('2022-11-01 00:00').unix()
         && userDidSelectCustomZone;
}

const prepareAggregatedStatsData = (key, data, aggregationLevel, aanbiedersexclude='') => {
  // Validate data object
  if(! data || ! data[`${key}_aggregated_stats`] || ! data[`${key}_aggregated_stats`].values) {
    return [];
  }
  // Exclude some providers from the result
  const providersToRemoveFromData = archivedProviders;
  // Map data
  const dateFormat = getDateFormat(aggregationLevel);
  return data[`${key}_aggregated_stats`].values.map(x => {
    const { start_interval, ...rest } = x;
    let item = {...rest, ...{ name: moment(start_interval).format(dateFormat) }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
    if(aanbiedersexclude !== '') {
      const exclude = aanbiedersexclude.split(',')
      Object.keys(item).forEach(key=>{if(exclude.includes(key)) {delete item[key]}});
    }
    if(providersToRemoveFromData && providersToRemoveFromData.length > 0) {
      const exclude = providersToRemoveFromData;
      Object.keys(item).forEach(key=>{if(exclude.includes(key)) {delete item[key]}});
    }
    return item;
  });
}

const prepareAggregatedStatsData_timescaleDB = (key, data, aggregationLevel, aanbiedersexclude='') => {
  // Validate data object
  if(! data || ! data[`availability_stats`] || ! data[`availability_stats`].values) {
    return [];
  }
  // Exclude some providers from the result
  const providersToRemoveFromData = archivedProviders;
  // Map data
  const dateFormat = getDateFormat(aggregationLevel);
  return data[`availability_stats`].values.map(x => {
    const { time, ...rest } = x;
    let item = {...rest, ...{ time: moment(time.replace('Z', '')).format(dateFormat) }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
    // Remove providers that are not selected
    if(aanbiedersexclude !== '') {
      const exclude = aanbiedersexclude.split(',')
      Object.keys(item).forEach(key=>{if(exclude.includes(key)) {delete item[key]}});
    }
    // Remove archived providers that are not in the UI anymore
    if(providersToRemoveFromData && providersToRemoveFromData.length > 0) {
      const exclude = providersToRemoveFromData;
      Object.keys(item).forEach(key=>{if(exclude.includes(key)) {delete item[key]}});
    }
    return item;
  });
}

const sumAggregatedStats = (data) => {
  return data.map(x => {
    // Sum all values
    let total = 0;
    Object.keys(x).forEach(key => {
      if(key !== 'name') {
        total += parseInt(x[key]);
      }
    });
    // Return total
    return {
      name: x.name,
      total: total
    }
  });
}

export {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone,
  sumAggregatedStats
}
