import moment from 'moment';
import {
  createFilterparameters,
  convertDurationToBin,
  abortableFetch,
  shouldFetchVehicles,
  isNearRealtime
} from './pollTools.js';
import { isLoggedIn, isAdmin } from '../helpers/authentication.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';
import { isInNetherlands } from '../helpers/netherlands';
import { UNKNOWN_DURATION_BIN } from '../components/Map/vehicle_marker.js';

var store_parkingdata;
var timerid_parkingdata;

// In-flight request tracking (combined key of own + public URLs)
let theFetch = null;
let theFetchUrl = null;

// Built features from the last successful fetch (before client-side filters)
let cachedFeatures = null;

// Client-side filter fields applied to cachedFeatures last
let existingClientFilter = null;

// Filter snapshot used by shouldFetchVehicles
let existingFilter;

// Separate short-lived cache for the public NL vehicles (after NL check)
const PUBLIC_CACHE_TTL_MS = 60 * 1000;
let publicVehiclesCache = {
  url: null,
  vehicles: null,
  fetchedAt: 0
};

// Last own / public raw vehicles used for own-first + merge
let lastOwnVehicles = null;
let lastPublicVehicles = null;

/**
 * Logged-in users (except NL-wide/admin accounts, whose park_events already
 * cover the whole country) can also see the public vehicles outside their own
 * data area, but only for a (near) realtime date/time: the public vehicles
 * are not available historically.
 */
export const shouldIncludePublicVehicles = (state) => {
  if(! isLoggedIn(state)) return false;
  if(isAdmin(state) || state.metadata?.is_admin === true) return false;
  if(! isNearRealtime(state.filter?.datum)) return false;
  return state.filter?.show_all_nl_vehicles !== false;
};

// ~11m (latitude) grid cells used to match public vehicles to park_events
const DEDUPE_GRID_SIZE = 0.0001;

const toGridCell = (v) => [
  Math.floor(v.location.longitude / DEDUPE_GRID_SIZE),
  Math.floor(v.location.latitude / DEDUPE_GRID_SIZE)
];

/**
 * Combines the user's own (detailed) park_events with the public vehicles.
 * The public list also contains the vehicles in the user's own area, so drop
 * every public vehicle that has a park_event of the same operator in the same
 * or a neighbouring grid cell.
 */
export const mergeOwnAndPublicVehicles = (ownVehicles, publicVehicles) => {
  const ownCells = new Set();
  ownVehicles.forEach(v => {
    if(! v.location) return;
    const [x, y] = toGridCell(v);
    ownCells.add(`${v.system_id}:${x}:${y}`);
  });

  const publicOutsideOwnArea = publicVehicles.filter(v => {
    const systemId = v.system_id || v.value;
    const [x, y] = toGridCell(v);
    for(let dx = -1; dx <= 1; dx++) {
      for(let dy = -1; dy <= 1; dy++) {
        if(ownCells.has(`${systemId}:${x + dx}:${y + dy}`)) return false;
      }
    }
    return true;
  });

  return ownVehicles.concat(publicOutsideOwnArea);
};

const CLIENT_FILTER_FIELDS = [
  'aanbiedersexclude',
  'parkeerduurexclude',
  'non_operational_only'
];

export const didClientFilterChange = (newFilter, oldFilter) => {
  if (!oldFilter) return true;
  return CLIENT_FILTER_FIELDS.some((field) => newFilter?.[field] !== oldFilter?.[field]);
};

/**
 * Build GeoJSON features once from raw API vehicles. Date parsing and
 * duration_bin happen here so client-side filter changes stay cheap.
 */
export const buildVehicleFeatures = (state, vehicles) => {
  const start_time_ms = moment(state.filter.datum).valueOf();
  const features = [];

  vehicles.forEach(v => {
    if (!v.location) return;

    const isOwnData = v.is_own_data === true;
    // Public vehicles merged for Heel NL are context (muted clusters)
    const isContext = v.is_context === true;
    const in_public_space_since = isOwnData ? v.start_time : v.in_public_space_since;

    let since_ms = in_public_space_since ? Date.parse(in_public_space_since) : Date.now();
    if (isNaN(since_ms) && in_public_space_since) {
      since_ms = moment(in_public_space_since).valueOf();
    }
    const minutes = Math.floor((start_time_ms - since_ms) / 60000);
    // The public dataset has no parked-since time: show context vehicles grey
    // instead of as "parked less than 2 days"
    const duration_bin = (isContext && !in_public_space_since)
      ? UNKNOWN_DURATION_BIN
      : convertDurationToBin(minutes);

    features.push({
      type: 'Feature',
      properties: {
        id: v.location.latitude + ',' + v.location.longitude,
        vehicle_id: v.bike_id,
        system_id: v.system_id || v.value,
        form_factor: v.form_factor || null,
        in_public_space_since: in_public_space_since,
        duration_bin: duration_bin,
        is_non_operational: v.is_non_operational === true,
        is_own_data: isOwnData,
        is_context: isContext,
      },
      geometry: {
        type: 'Point',
        coordinates: [
          v.location.longitude,
          v.location.latitude,
          0.0
        ]
      }
    });
  });

  return features;
};

/**
 * Cheap client-side filter over already-built features.
 */
export const filterVehicleFeatures = (state, features) => {
  const aanbiedersexclude = (state.filter.aanbiedersexclude || '').split(',').filter(Boolean);
  const parkeerduurexclude = (state.filter.parkeerduurexclude || '').split(',').filter(Boolean);
  const showOnlyNonOperational = state.filter.non_operational_only === true;
  const loggedIn = isLoggedIn(state);

  const operatorstats = {};
  (state.metadata.aanbieders || []).forEach(o => {
    operatorstats[o.system_id || o.value] = 0;
  });

  const visible = [];
  features.forEach(feature => {
    const props = feature.properties;
    const systemId = props.system_id;

    operatorstats[systemId] = (operatorstats[systemId] || 0) + 1;

    const canFilterOnDuration = loggedIn && Boolean(props.in_public_space_since);
    let markerVisible = !canFilterOnDuration
      || !parkeerduurexclude.includes(String(props.duration_bin));
    markerVisible = markerVisible && !aanbiedersexclude.includes(systemId);
    if (showOnlyNonOperational) {
      markerVisible = markerVisible && props.is_non_operational === true;
    }
    if (markerVisible) {
      visible.push(feature);
    }
  });

  return {
    geoJson: {
      type: 'FeatureCollection',
      features: visible
    },
    operatorstats
  };
};

const publishFilteredFeatures = (state, features) => {
  const { geoJson, operatorstats } = filterVehicleFeatures(state, features);
  if (process && process.env.DEBUG) console.log('geoJson in pollParkingData', geoJson);

  store_parkingdata.dispatch({
    type: 'SET_VEHICLES',
    payload: geoJson
  });
  store_parkingdata.dispatch({
    type: 'SET_VEHICLES_OPERATORSTATS',
    payload: operatorstats
  });
};

const processVehiclesResult = (state, vehicles) => {
  cachedFeatures = buildVehicleFeatures(state, vehicles);
  existingClientFilter = {
    aanbiedersexclude: state.filter.aanbiedersexclude,
    parkeerduurexclude: state.filter.parkeerduurexclude,
    non_operational_only: state.filter.non_operational_only
  };
  publishFilteredFeatures(state, cachedFeatures);
};

const withParams = (baseUrl, params) => (
  params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl
);

const filterPublicVehiclesInNl = (vehicles) => (
  (vehicles || []).filter(v => (
    v.location && isInNetherlands(v.location.longitude, v.location.latitude)
  ))
);

const getCachedPublicVehicles = (url) => {
  if (
    publicVehiclesCache.url === url
    && publicVehiclesCache.vehicles
    && (Date.now() - publicVehiclesCache.fetchedAt) < PUBLIC_CACHE_TTL_MS
  ) {
    return publicVehiclesCache.vehicles;
  }
  return null;
};

const setCachedPublicVehicles = (url, vehicles) => {
  publicVehiclesCache = {
    url,
    vehicles,
    fetchedAt: Date.now()
  };
};

const withFlags = (vehicles, { isOwn, isContext }) => (
  (vehicles || []).map(v => ({
    ...v,
    is_own_data: isOwn,
    is_context: isContext
  }))
);

const setVehiclesLoading = (isLoading) => {
  store_parkingdata.dispatch({ type: 'SET_VEHICLES_LOADING', payload: isLoading });
  store_parkingdata.dispatch({ type: 'SHOW_LOADING', payload: isLoading });
};

const clearVehiclesOnFailure = () => {
  cachedFeatures = null;
  lastOwnVehicles = null;
  lastPublicVehicles = null;
  store_parkingdata.dispatch({ type: 'CLEAR_VEHICLES' });
};

/**
 * Publish the current own + public mix to the store. Used for own-first
 * updates and for the final combined result.
 *
 * `is_context` is only set on public vehicles when a logged-in user has
 * Heel NL on (own + public). Guests and "Mijn gebied" stay unmarked so
 * all their clusters keep the normal green colour.
 */
const publishMergedVehicles = (ownVehicles, publicVehicles) => {
  const own = withFlags(ownVehicles, { isOwn: true, isContext: false });
  const publicList = publicVehicles || [];
  const hasOwnAndPublic = own.length > 0 && publicList.length > 0;
  // Only mark public vehicles as context when they sit next to the user's
  // own data (Heel NL). Guests and "Mijn gebied" stay unmarked.
  const publicCtx = withFlags(publicList, {
    isOwn: false,
    isContext: hasOwnAndPublic
  });

  let vehicles;
  if (hasOwnAndPublic) {
    vehicles = mergeOwnAndPublicVehicles(own, publicCtx);
  } else if (own.length > 0) {
    vehicles = own;
  } else {
    vehicles = publicCtx;
  }
  processVehiclesResult(store_parkingdata.getState(), vehicles);
};

const doApiCall = (state) => {
  const canfetchdata = state && isLoggedIn(state) && state.filter && state.authentication.user_data.token;
  const is_admin = isAdmin(state);

  const filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata, {
    show_global: is_admin,
    is_logged_in: isLoggedIn(state)
  });

  const ownUrl = canfetchdata
    ? withParams(`${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/park_events`, filterparams)
    : null;

  let publicUrl = null;
  if (!canfetchdata) {
    publicUrl = withParams(
      `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/vehicles_in_public_space`,
      filterparams
    );
  } else if (shouldIncludePublicVehicles(state)) {
    const nlWideParams = createFilterparameters(
      DISPLAYMODE_PARK,
      { ...state.filter, gebied: '', zones: '' },
      state.metadata,
      { show_global: true, is_logged_in: false }
    );
    publicUrl = withParams(
      `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/vehicles_in_public_space`,
      nlWideParams
    );
  }

  const cachedPublic = publicUrl ? getCachedPublicVehicles(publicUrl) : null;
  const needsPublicFetch = Boolean(publicUrl) && !cachedPublic;

  // Key only the URLs that will actually be fetched, so a plaats change
  // with a still-valid public cache doesn't look like a brand-new request.
  const url = [
    ownUrl || '',
    needsPublicFetch ? publicUrl : (publicUrl ? `cached:${publicUrl}` : '')
  ].join(' + ');

  if (theFetch && theFetchUrl === url) {
    return;
  }

  setVehiclesLoading(true);

  if (theFetch) {
    theFetch.abort();
  }

  const ownFetch = ownUrl ? abortableFetch(ownUrl, {
    headers: { authorization: 'Bearer ' + state.authentication.user_data.token }
  }) : null;
  const publicFetch = needsPublicFetch ? abortableFetch(publicUrl, {}) : null;

  const thisFetch = {
    abort: () => {
      if (ownFetch) ownFetch.abort();
      if (publicFetch) publicFetch.abort();
    }
  };
  theFetch = thisFetch;
  theFetchUrl = url;

  const clearFetchTracking = () => {
    if (theFetch === thisFetch) {
      theFetch = null;
      theFetchUrl = null;
    }
  };

  const readJson = (theAbortableFetch, theUrl) => theAbortableFetch.ready.then(response => {
    if (!response.ok) {
      throw new Error(`unable to fetch ${theUrl} (HTTP ${response.status})`);
    }
    return response.json();
  });

  let ownDone = !ownFetch;
  let publicDone = !publicFetch;
  let ownVehicles = null;
  let publicVehicles = cachedPublic;

  const tryFinish = () => {
    if (theFetch !== thisFetch) return;
    if (!ownDone || !publicDone) return;

    lastOwnVehicles = ownVehicles;
    lastPublicVehicles = publicVehicles;

    if (ownVehicles === null && publicVehicles === null) {
      clearVehiclesOnFailure();
    } else if (ownVehicles !== null && publicVehicles !== null) {
      publishMergedVehicles(ownVehicles, publicVehicles);
    } else if (ownVehicles !== null) {
      publishMergedVehicles(ownVehicles, []);
    } else {
      // Guest / public-only
      publishMergedVehicles([], publicVehicles);
    }

    clearFetchTracking();
    setVehiclesLoading(false);
  };

  const onOwnReady = (json) => {
    if (theFetch !== thisFetch) return;
    ownVehicles = (json && json.park_events) || [];
    ownDone = true;

    // Own-first: show own vehicles immediately, keeping previous public
    // context until the new public data arrives (or using the cache).
    if (canfetchdata) {
      const publicForNow = publicDone
        ? (publicVehicles || [])
        : (lastPublicVehicles || cachedPublic || []);
      publishMergedVehicles(ownVehicles, publicForNow);
    }

    tryFinish();
  };

  const onPublicReady = (json) => {
    if (theFetch !== thisFetch) return;
    const filtered = filterPublicVehiclesInNl(
      (json && json.vehicles_in_public_space) || []
    );
    setCachedPublicVehicles(publicUrl, filtered);
    publicVehicles = filtered;
    publicDone = true;

    if (ownDone) {
      tryFinish();
    }
  };

  if (ownFetch) {
    readJson(ownFetch, ownUrl).then(onOwnReady).catch(ex => {
      if (theFetch !== thisFetch) return;
      console.error('unable to load own park_events', ex);
      // Own data is required for logged-in users; clear so outdated markers
      // are not left looking current.
      ownVehicles = null;
      ownDone = true;
      if (publicFetch && !publicDone) {
        thisFetch.abort();
      }
      clearVehiclesOnFailure();
      clearFetchTracking();
      setVehiclesLoading(false);
    });
  }

  if (publicFetch) {
    readJson(publicFetch, publicUrl).then(onPublicReady).catch(ex => {
      if (theFetch !== thisFetch) return;
      // For logged-in users public is optional context
      if (!ownFetch) {
        console.error('unable to load public vehicles', ex);
        publicVehicles = null;
        publicDone = true;
        clearVehiclesOnFailure();
        clearFetchTracking();
        setVehiclesLoading(false);
        return;
      }
      console.error('unable to load public vehicles outside own data area', ex);
      publicVehicles = [];
      publicDone = true;
      tryFinish();
    });
  } else if (cachedPublic) {
    publicVehicles = cachedPublic;
    publicDone = true;
  } else if (!publicUrl) {
    // Heel NL off / no public request: treat as empty public set
    publicVehicles = [];
    publicDone = true;
  }

  // Everything already available (e.g. guest with a warm public cache)
  if (ownDone && publicDone) {
    tryFinish();
  }
};

const updateParkingData = async () => {
  try {
    if (undefined === store_parkingdata) {
      if (process && process.env.DEBUG) console.error('no redux state available yet - skipping zones update');
      return false;
    }

    const state = store_parkingdata.getState();
    if (!state) return;

    const doFetchVehicles = shouldFetchVehicles(state.filter, existingFilter);
    const clientFilterChanged = didClientFilterChange(state.filter, existingClientFilter);

    existingFilter = state.filter;

    if (doFetchVehicles || (!cachedFeatures && !theFetch)) {
      doApiCall(state);
    } else if (cachedFeatures && clientFilterChanged) {
      existingClientFilter = {
        aanbiedersexclude: state.filter.aanbiedersexclude,
        parkeerduurexclude: state.filter.parkeerduurexclude,
        non_operational_only: state.filter.non_operational_only
      };
      publishFilteredFeatures(state, cachedFeatures);
    }
    // else: nothing relevant changed, or a fetch is already in flight
  } catch (ex) {
    console.error('Unable to update zones', ex);
  }
};

export const initUpdateParkingData = (_store) => {
  store_parkingdata = _store;
  if (!store_parkingdata) { console.log('No store yet.'); return; }
  if (timerid_parkingdata) { clearTimeout(timerid_parkingdata); }
  updateParkingData();
};
