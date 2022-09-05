import moment from 'moment';
import {archivedProviders} from './providers.js';

const prepareAggregatedStatsData = (key, data, aggregationLevel, aanbiedersexclude='') => {
  if(! data || ! data[`${key}_aggregated_stats`] || ! data[`${key}_aggregated_stats`].values) {
    return [];
  }
  const getDateFormat = (aggregationLevel) => {
    if(aggregationLevel === 'day') {
      return 'DD MMM YYYY';
    }
    else if(aggregationLevel === 'week') {
      return '[w]W, YYYY';
    }
    else if(aggregationLevel === 'month') {
      return 'MMM YYYY';
    }
  }
  const providersToRemoveFromData = archivedProviders;
  return data[`${key}_aggregated_stats`].values.map(x => {
    const { start_interval, ...rest } = x;
    let item = {...rest, ...{ name: moment(start_interval).format(getDateFormat(aggregationLevel)) }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
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

export {
  prepareAggregatedStatsData
}
