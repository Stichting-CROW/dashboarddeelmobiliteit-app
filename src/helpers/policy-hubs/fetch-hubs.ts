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
  affected_modalities
}: {
  token: string,
  municipality?: string,
  phase: string,
  visible_layers: string[],
  affected_modalities?: string[]
}, uuid): Promise<any> => {
  // Abort previous fetch, if any
  if(theFetch[uuid]) {
    await theFetch[uuid].abort();
    delete theFetch[uuid];
  }
  
  const queryParts: string[] = [];

  if (municipality?.trim()) {
    queryParts.push(`municipality=${encodeURIComponent(municipality.trim())}`);
  }

  const appendQueryPart = (part: string) => {
    if (queryParts.indexOf(part) <= -1) {
      queryParts.push(part);
    }
  };

  // Add phases to URL
  visible_layers.forEach(layer => {
    const phase_name = layer.split('-')[1];
    if (phase_name && phase_name !== 'null') {
      appendQueryPart(`phases=${phase_name}`);
    }
  });

  // If concept phase is visible: Show retirement concepts as well (hubs based on a previously published hub)
  if (visible_layers.indexOf('concept') > -1) {
    appendQueryPart('phases=retirement_concept');
  }
  // Same for retirement committed concepts
  if (visible_layers.indexOf('committed_concept') > -1) {
    appendQueryPart('phases=committed_retirement_concept');
  }
  // Same for retirement published concepts
  if (visible_layers.indexOf('published') > -1) {
    appendQueryPart('phases=published_retirement');
  }

  // If published: Show zones that will be archived in the future
  if (phase === 'published') {
    appendQueryPart('phases=retirement_concept');
    appendQueryPart('phases=committed_retirement_concept');
    appendQueryPart('phases=published_retirement');
  }
  // If active: Show zones that will be archived in the future
  else if (phase === 'active') {
    appendQueryPart('phases=retirement_concept');
    appendQueryPart('phases=committed_retirement_concept');
    appendQueryPart('phases=published_retirement');
  }

  // Add affected modalities to URL
  if (affected_modalities) {
    const allowed_modalities = ['car', 'cargo_bicycle', 'bicycle', 'moped'];
    const filtered = affected_modalities.filter(x => allowed_modalities.includes(x));
    filtered.forEach(x => {
      appendQueryPart(`affected_modalities=${x}`);
    });
  }

  // Don't execute if no phase was given, as at least 1 phases param should be specified
  if (!queryParts.some((part) => part.startsWith('phases='))) return;

  const url = `${process.env.REACT_APP_MDS_URL}/${token ? 'admin' : 'public'}/zones?${queryParts.join('&')}`;

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
