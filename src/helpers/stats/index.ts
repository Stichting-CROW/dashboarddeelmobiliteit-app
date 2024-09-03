import moment from 'moment-timezone';
import {archivedProviders} from '../providers.js';

import {
  getAggregatedChartData,
  getAggregatedVehicleData
} from './parking-data';

import {
  getAggregatedRentalsData,
  getAggregatedRentalsChartData
} from './rental-data';

import {
  getZoneById,
} from '../../components/Map/MapUtils/zones.js';

export const getDateFormat = (aggregationLevel) => {
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
    return 'dd DD MMM YYYY';
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
  return data[`${key}_aggregated_stats`].values.map(x => {
    const { start_interval, ...rest } = x;
    let item = {...rest, ...{ name: start_interval }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
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
  const theKey = key === 'available_vehicles' ? 'availability_stats' : 'rental_stats';
  // Validate data object
  if(! data || ! data[theKey] || ! data[theKey].values
   ) {
    return [];
  }
  // Exclude some providers from the result
  const providersToRemoveFromData = archivedProviders;
  // Map data
  const dateFormat = getDateFormat(aggregationLevel);
  return data[theKey].values.map(x => {
    const { time, ...rest } = x;
    // let item = {...rest, ...{ time: moment.tz(time.replace('Z', ''), 'Europe/Amsterdam').format('YYYY-MM-DD HH:mm:ss') }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
    // Inspiration from https://stackoverflow.com/a/51764389
    let item = {...rest, ...{ time: moment.tz(
      time,
      time.indexOf('+') > -1 ? "YYYY-MM-DDTHH:mm:ss+00:00Z" : "YYYY-MM-DDTHH:mm:ssZ",
      true,
      'Europe/Amsterdam'
    ).format('YYYY-MM-DD HH:mm:ss') }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax

    // For rental data: sum modality counts for every provider
    if(theKey === 'rental_stats') {
      let newProviderObject: {
        time?: any
      } = {};
      // Loop all providers for this item
      Object.keys(item).forEach(providerKey => {
        if(providerKey === 'time') {
          newProviderObject.time = item[providerKey];
          return;
        }
        // Loop all modalities for this item
        let providerRentalsCount = 0;
        Object.keys(item[providerKey]).forEach(modalityKey => {
          providerRentalsCount += item[providerKey][modalityKey].rentals_started;
        });
        newProviderObject[providerKey] = providerRentalsCount;
      });
      item = newProviderObject;
    }

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

export const aggregationFunctionButtonsToRender = [
  // {name: 'MIN', title: 'min'},
  // {name: 'AVG', title: 'gemiddeld'},
  {name: 'MAX', title: 'max'},
];

// Function get gets all column headers based on the dataset
const getHeadersBasedOnData = (data: any) => {
  // Define placeholder variable that'll contain all unique keys/headers
  let uniqueHeaders = ['time'];
  // Loop all rows
  data.map((x, index) => {
    // Get unique keys for this object row
    const objectKeys = Object.keys(data[index]);
    // For every key:
    objectKeys.forEach(key => {
      // If key wasn't present in the dataset yet:
      if(uniqueHeaders.indexOf(key) <= -1) {
        // Add key to uniqueHeaders array
        uniqueHeaders.push(key);
      }
    })
  });

  return uniqueHeaders;
}

export const prepareDataForCsv = (data: any) => {
  if(! data || data.length <= 0) return;
  if(  typeof data !== 'object') return;

  let csvRows = [];

  // Get headers
  const headers = getHeadersBasedOnData(data);
  csvRows.push(headers.join(','));

  // Loop over the rows
  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header];
      if(! value) return '"0"';

      // If this is the name (date) field: convert it to YYYY-MM-DD
      // Old way of aggregating data (on daily basis) ->
      if(header === 'name') {
        value = moment(row[header]).format('YYYY-MM-DD');
      }
      // // If this is the name (date) field: convert it to YYYY-MM-DD
      // // New way of aggregating data (on hourly basis etc) ->
      // else if(header === 'time') {
      //   value = moment(row[header]).format('YYYY-MM-DD');
      // }

      // Escape it: Replace " with \"
      value = (''+value).replace(/"/g, '\\"');
      // Return
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  };

  return csvRows.join("\n");
}

export const downloadCsv = (data: any, filename?: string) => {
  // Create blob
  const blob = new Blob([data], { type: 'text/csv' });
  // Send blob to the browser
  const url = window.URL.createObjectURL(blob);
  // Create an a-tag
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename ? filename : 'download.csv');
  document.body.appendChild(a);
  // Click it
  a.click();
  // Remove it
  document.body.removeChild(a);

  return;
}

  
  // Filter out operators that are not active
  const keepActiveOperators = (chartDataset, activeOperators) => {
    return chartDataset.map(timeframe => {
      // https://stackoverflow.com/a/38750895
      const allowedOperators = activeOperators.map(x=>x.system_id)
      return Object.keys(timeframe)
        .filter(key => allowedOperators.includes(key) || key === 'name' || key === 'time')
        .reduce((obj, key) => {
          obj[key] = timeframe[key];
          return obj;
        }, {});
    });
  }

export {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone,
  sumAggregatedStats,
  getAggregatedVehicleData,
  getAggregatedChartData,

  getAggregatedRentalsData,
  getAggregatedRentalsChartData,

  keepActiveOperators
}
