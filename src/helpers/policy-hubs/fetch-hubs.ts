import md5 from 'md5';
import { abortableFetch } from "../../poll-api/pollTools";

const getHeaders = (token): {
  method?: any,
  mode?: any,
  body?: any,
  headers: any,
} => {
  return {
    method: "GET",
    headers: {
      "Authorization":  `Bearer ${token}`,
      "Content-Type": 'application/json'
    }
  };
}

// Variable that will prevent simultaneous loading of fetch requests
let theFetch = {};

export const fetch_hubs = async ({
  token,
  municipality,
  phase,
  visible_layers,
}, uuid) => {
  // Abort previous fetch, if any
  if(theFetch[uuid]) {
    await theFetch[uuid].abort();
    delete theFetch[uuid];
  }
  
  // Set MDS URL
  let url = `${process.env.REACT_APP_MDS_URL}/${token ? 'admin' : 'public'}/zones`+
              `?municipality=${municipality}`;
  // Add phases to URL
  visible_layers.forEach(layer => {
    // Don't have duplicates
    if(url.indexOf(`&phases=${layer.split('-')[1]}`) > -1) return;
    const phase_name = layer.split('-')[1];
    if(phase_name && phase_name !== 'null') {
      // Add phase to URL
      url += `&phases=${phase_name}`;
    }
  });

  // If concept phase is visible: Show retirement concepts as well (hubs based on a previously published hub)
  url += visible_layers.indexOf('concept') ? '&phases=retirement_concept' : '';
  // Same for retirement committed concepts
  url += visible_layers.indexOf('committed_concept') ? '&phases=committed_retirement_concept' : '';
  // Same for retirement published concepts
  url += visible_layers.indexOf('published') ? '&phases=published_retirement' : '';

  // If published: Show zones that will be archived in the future
  if(phase === 'published') {
    url += `&phases=retirement_concept`
    url += `&phases=committed_retirement_concept`
    url += `&phases=published_retirement`
  }
  // If active: Show zones that will be archived in the future
  else if(phase === 'active') {
    url += `&phases=retirement_concept`
    url += `&phases=committed_retirement_concept`
    url += `&phases=published_retirement`
  }

  // Don't execute if no phase was given, as at least 1 phases param should be specified
  if(url.indexOf('phases=') <= -1) return;

  // Now do a new fetch
  let json;
  try {
    const options = token ? getHeaders(token) : {};
    theFetch[uuid] = abortableFetch(url, options);
    const response = await theFetch[uuid].ready;
    // Set theFetch to null, so next request is not aborted
    delete theFetch[uuid];
    json = await response.json();
  }
  catch(err) {
    // Set theFetch to null, so next request is not aborted
    delete theFetch[uuid];

    // If this was an abort error, no problem
    if(err && err.name === 'AbortError') return;
    console.log(err);
  }

  return json;
}
