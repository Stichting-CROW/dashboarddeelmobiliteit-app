import { createFilterparameters } from '../poll-api/pollTools.js';
import { DISPLAYMODE_OTHER } from '../reducers/layers.js';
import saveAs from 'file-saver';

const getFetchOptions = (token) => {
  return {
    headers: {
      "authorization": `Bearer ${token}`
    }
  }
}

export const getAggregatedStats = async (token, key, options) => {
  // Define API end point URL
  let url = `https://api.deelfietsdashboard.nl/dashboard-api/aggregated_stats/${key}?aggregation_level=${options.aggregationLevel}`;

  // Set filter params if needed
  // Example URL: `https://api.deelfietsdashboard.nl/dashboard-api/aggregated_stats/${key}?start_time=${options.startTime}&end_time=${options.endTime}&operators=${options.operators}&zone_ids=${options.zoneIds}&aggregation_level=${options.aggregationLevel}`;
  let filterParams = createFilterparameters(DISPLAYMODE_OTHER, options.filter, options.metadata);
  if(filterParams.length>0) url += "&" + filterParams.join("&");

  // Get API response  
  const fetchOptions = getFetchOptions(token)
  const response = await fetch(url, fetchOptions);
  const responseJson = await response.json();

  // Return
  return responseJson;
}

export const downloadReport = async (token, options) => {
  let url = `https://api.deelfietsdashboard.nl/dashboard-api/stats/generate_report?start_time=${options.startDate}&end_time=${options.endDate}&gm_code=${options.gm_code}`;

  // Get API response  
  const fetchOptions = getFetchOptions(token)
  const response = await fetch(url, fetchOptions);
  const responseBlob = await response.blob();

  saveAs(responseBlob, `rapportage_${options.startDate}-${options.endDate}_${options.gm_code}.xlsx`)
}

export const downloadRawData = async (token, options) => {
  let url = `https://api.deelfietsdashboard.nl/dashboard-api/raw_data?start_time=${options.startDate}&end_time=${options.endDate}`;

  // Get API response      
  const fetchOptions = getFetchOptions(token)
  const response = await fetch(url, fetchOptions);
  const responseBlob = await response.blob();

  saveAs(responseBlob, `export_dashboarddeelmobiliteit_${options.startDate}-${options.endDate}_${options.gm_code}.zip`)
}

