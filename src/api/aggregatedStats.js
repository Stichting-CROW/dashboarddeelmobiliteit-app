import { createFilterparameters, isLoggedIn } from '../poll-api/pollTools.js';

export const getAggregatedStats = async (token, key, options) => {
  // Example URL: `https://api.deelfietsdashboard.nl/dashboard-api/aggregated_stats/${key}?start_time=${options.startTime}&end_time=${options.endTime}&operators=${options.operators}&zone_ids=${options.zoneIds}&aggregation_level=${options.aggregationLevel}`;
  let url = `https://api.deelfietsdashboard.nl/dashboard-api/aggregated_stats/${key}?start_time=2021-01-01T18:00:00Z&end_time=2021-12-14T18:00:00Z&aggregation_level=${options.aggregationLevel}`;

  let filterParams = createFilterparameters(true, options.filter, options.metadata);
  if(filterParams.length>0) url += "&" + filterParams.join("&");
  console.log('url', url)

  let fetchOptions = {
    headers: {
      "authorization": `Bearer ${token}`
    }
  }
  
  const response = await fetch(url, fetchOptions);
  const responseJson = await response.json();

  return responseJson;
}
