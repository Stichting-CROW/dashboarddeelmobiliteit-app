import { createFilterparameters } from '../poll-api/pollTools.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';

const getFetchOptions = (token) => {
  return {
    headers: {
      "authorization": `Bearer ${token}`
    }
  }
}

export const getAdminZones = async (token, filter) => {
  if(! filter) return {};
  if(! filter.municipality) return {};

  let filterParams = `municipality=${filter.municipality}&geography_types=no_parking&geography_types=stop&geography_types=monitoring`;
  // filterParams = filterParams.join("&");

  const url = `https://mds.dashboarddeelmobiliteit.nl/admin/zones?${filterParams}`;
  const response = await fetch(url, getFetchOptions(token));
  return await response.json();
}

export const postZone = async (token, data) => {
  const url = `https://mds.dashboarddeelmobiliteit.nl/admin/zone`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  }));
  return await response.json();
}

