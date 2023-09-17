import { createFilterparameters } from '../poll-api/pollTools.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';
import {shouldFetchVehicleStats} from '../poll-api/pollTools.js';

// Variable to keep track of vehicles response
// Only do a new fetch() if needed
let activeEventStats;

// Variable to keep track of filter changes
// Only do a new fetch() if needed
let existingFilter;

export const getParkEventsStats = async (token, options) => {
  // Example URL: `https://api.deelfietsdashboard.nl/dashboard-api/v2/park_events/stats?timestamp=2022-01-19T23:00:00Z&operators=cykl,flickbike,donkey,mobike,htm,gosharing,check,felyx,deelfietsnederland,keobike,lime,baqme,cargoroo,uwdeelfiets,hely,tier&zone_ids=34234`;
  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/v2/park_events/stats?x=1`;

  // Should we (re)fetch vehicles?
  const doFetchVehicles = shouldFetchVehicleStats(options.filter, existingFilter);

  // Update active filter
  existingFilter = options.filter;

  // Return cached data
  if(! doFetchVehicles) return activeEventStats;

  let filterParams = createFilterparameters(DISPLAYMODE_PARK, options.filter, options.metadata);
  if(filterParams.length>0) url += "&" + filterParams.join("&");

  let fetchOptions = {
    headers: {
      "authorization": `Bearer ${token}`
    }
  }
  
  const response = await fetch(url, fetchOptions);
  const responseJson = await response.json();

  activeEventStats = responseJson;

  return responseJson;
}
