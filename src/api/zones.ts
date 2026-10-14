import { createFilterparameters } from '../poll-api/pollTools.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';
const didFetchSucceed = (response) => response.status >= 200 && response.status <= 299;

const getFetchOptions = (token?) => {
  if(token) {
    return {
      headers: {
        "authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "charset": "utf-8"
      }
    }
  }
  return {
    headers: {
      "Content-Type": "application/json",
      "charset": "utf-8"
    }
  }
}

const ZONE_PHASES_FOR_BELEIDSZONES =
  'phases=active&phases=retirement_concept&phases=committed_retirement_concept&phases=published_retirement&phases=archived';

export const getAdminZones = async (token, filter) => {
  if(! filter) return [];
  if(! filter.municipality) return [];

  let filterParams = `municipality=${filter.municipality}&geography_types=no_parking&geography_types=stop&geography_types=monitoring`;
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zones?${filterParams}`;
  const response = await fetch(url, getFetchOptions(token));
  if (! didFetchSucceed(response)) return;
  return await response.json();
}

/** Fetch zones including archived (for resolving prev_geographies on /stats/beleidszones). */
export const getAdminZonesWithArchived = async (token, filter) => {
  if (!filter?.municipality) return [];
  const filterParams = `municipality=${filter.municipality}&geography_types=no_parking&geography_types=stop&geography_types=monitoring&${ZONE_PHASES_FOR_BELEIDSZONES}`;
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zones?${filterParams}`;
  const response = await fetch(url, getFetchOptions(token));
  if (!didFetchSucceed(response)) return [];
  return await response.json();
}

export const getPublicZones = async (filter) => {
  let filterParams = (filter && filter.municipality) ? `municipality=${filter.municipality}&` : '';
  filterParams += `geography_types=no_parking&geography_types=stop&geography_types=monitoring`;
  const url = `${process.env.REACT_APP_MDS_URL}/public/zones?${filterParams}`;
  const response = await fetch(url, getFetchOptions());
  if (! didFetchSucceed(response)) return;
  return await response.json();
}

/** Fetch zones including archived (for resolving prev_geographies on /stats/beleidszones). */
export const getPublicZonesWithArchived = async (filter) => {
  if (!filter?.municipality) return [];
  const filterParams = `municipality=${filter.municipality}&geography_types=no_parking&geography_types=stop&geography_types=monitoring&${ZONE_PHASES_FOR_BELEIDSZONES}`;
  const url = `${process.env.REACT_APP_MDS_URL}/public/zones?${filterParams}`;
  const response = await fetch(url, getFetchOptions());
  if (!didFetchSucceed(response)) return [];
  return await response.json();
}

export const postZone = async (token, data) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'POST',
    body: JSON.stringify(data)
  }));
  if (! didFetchSucceed(response)) return;
  return await response.json();
}

export const putZone = async (token, data) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'PUT',
    body: JSON.stringify(data)
  }));
  if (! didFetchSucceed(response)) return;
  return await response.json();
}

export const deleteZone = async (token, geography_id) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone/${geography_id}`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'DELETE'
  }));
  if (! didFetchSucceed(response)) return;
  return response;
}
