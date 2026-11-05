import moment from 'moment';
import {
  createFilterparameters,
  convertDurationToBin,
  abortableFetch
} from './pollTools.js';
import { isLoggedIn, isAdmin } from '../helpers/authentication.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';
import {shouldFetchVehicles, isNearRealtime} from './pollTools.js';
import { isInNetherlands } from '../helpers/netherlands';

var store_parkingdata;
var timerid_parkingdata;

// theFetch: Variabele used for managing fetch calls
let theFetch = null;

// URL of the request currently in flight, so an identical request can reuse
// it instead of aborting and starting over (see doApiCall)
let theFetchUrl = null;

// Variable to keep track of vehicles response
// Only do a new fetch() if needed
let activeVehicles;

// Variable to keep track of filter changes
// Only do a new fetch() if needed
let existingFilter;

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

const processVehiclesResult = (state, vehicles) => {
  activeVehicles = vehicles;

  let geoJson = {
   "type":"FeatureCollection",
   "features":[]
  }
  
  let operatorcolors = {};
  let operatorstats = {}
  state.metadata.aanbieders.forEach(o => {
    operatorcolors[o.system_id || o.value]=o.color;
    operatorstats[o.system_id || o.value]=0;
  });

  var start_time = moment(state.filter.datum);
  const start_time_ms = start_time.valueOf();

  // Get list of providers to exclude
  const aanbiedersexclude = state.filter.aanbiedersexclude.split(",") || [];
  // Get parkeerduur length to exclude
  const parkeerduurexclude = state.filter.parkeerduurexclude.split(",") || [];
  const showOnlyNonOperational = state.filter.non_operational_only === true;
  const loggedIn = isLoggedIn(state);

  vehicles.forEach(v => {
    // park_events (own data area) have start_time, public vehicles have
    // in_public_space_since
    const isOwnData = v.is_own_data === true;
    let in_public_space_since = isOwnData ? v.start_time : v.in_public_space_since;

    // Plain Date math instead of constructing a moment per vehicle (~10x
    // faster over 25k+ vehicles); fall back to moment for exotic date formats
    let since_ms = in_public_space_since ? Date.parse(in_public_space_since) : Date.now();
    if(isNaN(since_ms) && in_public_space_since) {
      since_ms = moment(in_public_space_since).valueOf();
    }
    var minutes = Math.floor((start_time_ms - since_ms) / 60000);
    const duration_bin = convertDurationToBin(minutes);

    let feature = {
       "type":"Feature",
       "properties":{
          "id":v.location.latitude+","+v.location.longitude,
          "vehicle_id":v.bike_id,
          "system_id": v.system_id || v.value,// v.value is used in the public map
          "form_factor": v.form_factor || null,
          "in_public_space_since": in_public_space_since,
          "duration_bin": duration_bin,
          "is_non_operational": v.is_non_operational === true,
          "is_own_data": isOwnData,
       },
       "geometry":{
          "type":"Point",
          "coordinates":[
             v.location.longitude,
             v.location.latitude,
             0.0
          ]
       }
    }

    operatorstats[v.system_id || v.value]+=1;

    // Filter markers
    // The parkeerduur filter only applies to vehicles with a known parked-since time
    const canFilterOnDuration = loggedIn && Boolean(in_public_space_since);
    let markerVisible = ! canFilterOnDuration
      || ! parkeerduurexclude.includes(duration_bin.toString());
    markerVisible = markerVisible && (aanbiedersexclude.includes(v.system_id || v.value) === false)
    if (showOnlyNonOperational) {
      markerVisible = markerVisible && v.is_non_operational === true;
    }
    if(markerVisible) {
      geoJson.features.push(feature);
    }
  })
  if(process && process.env.DEBUG) console.log('geoJson in pollParkingData', geoJson)

  // Save vehicles in store
  store_parkingdata.dispatch({
    type: 'SET_VEHICLES',
    payload: geoJson
  })

  // Update operator stats (= number of vehicles per operator) in store
  store_parkingdata.dispatch({
    type: 'SET_VEHICLES_OPERATORSTATS',
    payload: operatorstats
  })
}

const doApiCall = (
  state,
  callback
) => {

  const canfetchdata = state && isLoggedIn(state)  && state.filter && state.authentication.user_data.token;
  const is_admin = isAdmin(state);

  const withParams = (baseUrl, params) => (
    params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl
  );

  const filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata, {
    show_global: is_admin,
    is_logged_in: isLoggedIn(state)
  });

  // Logged in: the user's own data area, with details like parkeerduur
  const ownUrl = canfetchdata
    ? withParams(`${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/park_events`, filterparams)
    : null;

  // Guests, or logged-in users who want to see all of NL: the public vehicles.
  // For logged-in users these are always NL-wide, regardless of the selected
  // plaats/zones (those only scope the user's own data).
  let publicUrl = null;
  if(! canfetchdata) {
    publicUrl = withParams(
      `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/vehicles_in_public_space`,
      filterparams
    );
  } else if(shouldIncludePublicVehicles(state)) {
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

  const url = [ownUrl, publicUrl].filter(Boolean).join(' + ');

  // If a request for these exact URLs is already in flight, let it finish
  // instead of aborting and re-issuing it: the response is processed with the
  // then-current store state, so the result is the same either way.
  if(theFetch && theFetchUrl === url) {
    return;
  }

  // Start loading
  store_parkingdata.dispatch({type: 'SHOW_LOADING', payload: true});

  // Abort previous fetch
  // Info:
  // - https://stackoverflow.com/q/63412985
  // - https://davidwalsh.name/cancel-fetch
  if(theFetch) {
    theFetch.abort();
  }
  // Now do a new fetch
  const ownFetch = ownUrl ? abortableFetch(ownUrl, {
    headers: { authorization: "Bearer " + state.authentication.user_data.token }
  }) : null;
  const publicFetch = publicUrl ? abortableFetch(publicUrl, {}) : null;
  const thisFetch = {
    abort: () => {
      if(ownFetch) ownFetch.abort();
      if(publicFetch) publicFetch.abort();
    }
  };
  theFetch = thisFetch;
  theFetchUrl = url;

  // Only clear the in-flight tracking if it still points at this request
  // (a newer request may have replaced it in the meantime)
  const clearFetchTracking = () => {
    if(theFetch === thisFetch) {
      theFetch = null;
      theFetchUrl = null;
    }
  };

  const readJson = (theAbortableFetch, theUrl) => theAbortableFetch.ready.then(response => {
    if(! response.ok) {
      throw new Error(`unable to fetch ${theUrl} (HTTP ${response.status})`);
    }
    return response.json();
  });

  const ownPromise = ownFetch ? readJson(ownFetch, ownUrl) : Promise.resolve(null);
  // For logged-in users the public vehicles are extra context: if they fail
  // to load, still show the user's own data
  const publicPromise = publicFetch
    ? readJson(publicFetch, publicUrl).catch(ex => {
      if(! ownFetch || theFetch !== thisFetch) throw ex;
      console.error("unable to load public vehicles outside own data area", ex);
      return null;
    })
    : Promise.resolve(null);

  Promise.all([ownPromise, publicPromise]).then(([ownJson, publicJson]) => {
    // Superseded by a newer request: let that one update the map
    if(theFetch !== thisFetch) return;

    // The public map only covers the Netherlands
    const publicVehicles = ((publicJson && publicJson.vehicles_in_public_space) || [])
      .filter(v => {
        return v.location && isInNetherlands(v.location.longitude, v.location.latitude);
      });

    let vehicles = publicVehicles;
    if(ownFetch) {
      const ownVehicles = ((ownJson && ownJson.park_events) || []);
      ownVehicles.forEach(v => { v.is_own_data = true; });
      vehicles = mergeOwnAndPublicVehicles(ownVehicles, publicVehicles);
    }

    // Process with the *current* store state (not the state at request
    // time), so client-side filters that changed while the request was in
    // flight are applied to the result.
    callback(store_parkingdata.getState(), vehicles);
  }).catch(ex => {
    // If this request was aborted because a newer one replaced it, leave the
    // loading state to the newer request
    if(theFetch !== thisFetch) return;
    console.error("fetch error - unable to fetch vehicles from %s", url, ex);
  }).finally(() => {
    if(theFetch !== thisFetch) return;
    clearFetchTracking();
    // Stop loading
    store_parkingdata.dispatch({type: 'SHOW_LOADING', payload: false});
  });

}

const updateParkingData = async () => {
  try {
    if(undefined===store_parkingdata) {
      if(process && process.env.DEBUG) console.error("no redux state available yet - skipping zones update");
      return false;
    }
    
    // Wait for zone data
    const state = store_parkingdata.getState();
    if(! state) return;

    // const canfetchdata = state && isLoggedIn(state)  && state.filter && state.authentication.user_data.token;

    // Should we (re)fetch vehicles?
    const doFetchVehicles = shouldFetchVehicles(state.filter, existingFilter);

    // Update active filter
    existingFilter = state.filter;

    if(doFetchVehicles || (! activeVehicles && ! theFetch)) {
      doApiCall(state, processVehiclesResult);
    } else if(activeVehicles) {
      // Regenerate geoJson without querying API
      processVehiclesResult(state, activeVehicles);
    }
    // else: no vehicles yet but a fetch is in flight; its callback processes
    // the response with the store state at completion time

  } catch(ex) {
    console.error("Unable to update zones", ex)
  } finally {
    //:)
  }
}

export const initUpdateParkingData = (_store) => {
  store_parkingdata = _store;
  if(! store_parkingdata) { console.log('No store yet.'); return; }
  if(timerid_parkingdata) { clearTimeout(timerid_parkingdata); }
  updateParkingData();
}
