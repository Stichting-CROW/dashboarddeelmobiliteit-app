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
let theFetch = null;

export const fetch_hubs = async ({
  token,
  municipality,
  phase,
  visible_layers
}) => {
  let url = `https://mds.test.dashboarddeelmobiliteit.nl/${token ? 'admin' : 'public'}/zones`+
              `?municipality=${municipality}`;
  // Add phases to URL
  visible_layers.forEach(layer => {
    // Don't have duplicates
    if(url.indexOf(`&phases=${layer.split('-')[1]}`) > -1) return;
    const phase_name = layer.split('-')[1];
    if(phase_name) {
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

  // This works:
  // const options = token ? getHeaders(token) : {};
  // theFetch = fetch(url, options);
  // const response = await theFetch;
  // const json = await response.json();
  // return json;
  // return;

  // Abort previous fetch
  if(theFetch) {
    // theFetch.abort()
  }
  // Now do a new fetch
  return new Promise(async (resolve, reject) => {
    try {
      const options = token ? getHeaders(token) : {};
      theFetch = abortableFetch(url, options);
      const response = await theFetch.ready;
      const json = await response.json();

      resolve(json);
    }
    catch(err) {
      reject(new Error('Error while fetching hubs'));
    }
  });
}
