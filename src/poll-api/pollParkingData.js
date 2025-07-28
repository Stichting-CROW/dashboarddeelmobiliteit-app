import moment from 'moment';
import {
  createFilterparameters,
  convertDurationToBin,
  abortableFetch
} from './pollTools.js';
import { isLoggedIn, isAdmin } from '../helpers/authentication.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';
import {shouldFetchVehicles} from './pollTools.js';

var store_parkingdata;
var timerid_parkingdata;

// theFetch: Variabele used for managing fetch calls
let theFetch = null;

// Variable to keep track of vehicles response
// Only do a new fetch() if needed
let activeVehicles;

// Variable to keep track of filter changes
// Only do a new fetch() if needed
let existingFilter;

// Request cache for deduplication
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

// Generate request signature for caching
const getRequestSignature = (state) => {
  const canfetchdata = state && isLoggedIn(state) && state.filter && state.authentication.user_data.token;
  const is_admin = isAdmin(state);
  
  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/vehicles_in_public_space`;
  
  if (canfetchdata) {
    url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/park_events`;
  }
  
  const filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata, {
    show_global: is_admin
  });
  
  return JSON.stringify({
    url,
    filterparams,
    token: canfetchdata ? state.authentication.user_data.token : null,
    isLoggedIn: isLoggedIn(state)
  });
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

  const md5 = require('md5');
  var start_time = moment(state.filter.datum);
  
  vehicles.forEach(v => {
    let in_public_space_since = isLoggedIn(state) ? v.start_time : v.in_public_space_since;

    var minutes = start_time.diff(moment(in_public_space_since), 'minutes');
    const duration_bin = convertDurationToBin(minutes);
    
    let feature = {
       "type":"Feature",
       "properties":{
          "id":md5(v.location.latitude+v.location.longitude),
          "vehicle_id":v.bike_id,
          "system_id": v.system_id || v.value,// v.value is used in the public map
          "form_factor": v.form_factor || null,
          "in_public_space_since": in_public_space_since,
          "duration_bin": duration_bin,
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

    // Get list of providers to exclude
    let aanbiedersexclude = state.filter.aanbiedersexclude.split(",") || []

    // Get parkeerduur length to exclude
    let parkeerduurexclude = state.filter.parkeerduurexclude.split(",") || [];

    // Filter markers
    let markerVisible = ! isLoggedIn(state) || !parkeerduurexclude.includes(duration_bin.toString());
    markerVisible = markerVisible && (aanbiedersexclude.includes(v.system_id || v.value) === false)
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
  // Check cache first
  const signature = getRequestSignature(state);
  const cached = requestCache.get(signature);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🚀 CACHE HIT: Using cached parking data (age:', Date.now() - cached.timestamp, 'ms)');
    callback(state, cached.data);
    return;
  }
  
  // console.log('🔄 CACHE MISS: Fetching fresh parking data');

  const canfetchdata = state && isLoggedIn(state)  && state.filter && state.authentication.user_data.token;
  const is_admin = isAdmin(state);

  // Set API URL
  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/vehicles_in_public_space`;

  let options = {};
  let filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata, {
    show_global: is_admin
  });

  // Debug logging for zone_ids parameter
  const hasZoneIds = filterparams.some(param => param.startsWith('zone_ids='));
  if (state.filter.gebied !== "" && !hasZoneIds) {
    console.warn("Missing zone_ids parameter for gebied:", state.filter.gebied, "zones_loaded:", state.metadata.zones_loaded, "zones_count:", state.metadata.zones ? state.metadata.zones.length : 0);
  } else if (state.filter.gebied !== "" && hasZoneIds) {
    // console.log("zone_ids parameter included for gebied:", state.filter.gebied);
  }

  // Set query params for guests
  if(! canfetchdata) {
    if(filterparams.length>0) {
      url += "?" + filterparams.join("&");
    }
  }

  // Set query params for logged in users
  else {
    if(null!==state.filter&&null!==state.authenticationdata) {
      url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/park_events`;
      if(filterparams.length>0) {
        url += "?" + filterparams.join("&");
      }
      options = {
        headers: { "authorization": "Bearer " + state.authentication.user_data.token }
      }
    }
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
  theFetch = abortableFetch(url, options);
  theFetch.ready.then(function(response) {
    // Set theFetch to null, so next request is not aborted
    theFetch = null;

    if(! response.ok) {
      console.error("unable to fetch: %o", response);
      return false
    }

    response.json().then(function(vehicles) {
      if(isLoggedIn(state)) {
        vehicles = vehicles.park_events
      } else {
        vehicles = vehicles.vehicles_in_public_space
      }
      
      // Cache the result
      requestCache.set(signature, {
        data: vehicles,
        timestamp: Date.now()
      });
      
      // Clean up old cache entries (keep only last 10 entries)
      if (requestCache.size > 10) {
        const entries = Array.from(requestCache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        entries.slice(10).forEach(([key]) => requestCache.delete(key));
      }
      
      callback(state, vehicles);
    }).catch(ex=>{
      console.error("unable to decode JSON");
    }).finally(()=>{
      // Stop loading
      store_parkingdata.dispatch({type: 'SHOW_LOADING', payload: false});
    })
  }).catch(ex=>{
    // Stop loading
    store_parkingdata.dispatch({type: 'SHOW_LOADING', payload: false});
    console.error("fetch error - unable to fetch JSON from %s", url);
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

    const canfetchdata = state && isLoggedIn(state)  && state.filter && state.authentication.user_data.token;

    // Check if zones are loaded when we have a gebied selected
    if (state.filter.gebied !== "" && (!state.metadata.zones_loaded || !state.metadata.zones || state.metadata.zones.length === 0)) {
      if(process && process.env.DEBUG) console.log("Zones not yet loaded for gebied:", state.filter.gebied, "- skipping parking data update");
      return false;
    }

    // Should we (re)fetch vehicles?
    const doFetchVehicles = shouldFetchVehicles(state.filter, existingFilter);

    // Also force refresh if zones just became available for this gebied
    const zonesJustBecameAvailable = existingFilter && 
      existingFilter.gebied === state.filter.gebied && 
      state.filter.gebied !== "" &&
      state.metadata.zones_loaded && 
      state.metadata.zones && 
      state.metadata.zones.length > 0;

    // Update active filter
    existingFilter = state.filter;

    if(doFetchVehicles || ! activeVehicles || zonesJustBecameAvailable) {
      doApiCall(state, processVehiclesResult);
    } else {
      // Regenerate geoJson without querying API
      processVehiclesResult(state, activeVehicles); 
    }

  } catch(ex) {
    console.error("Unable to update zones", ex)
  } finally {
    //:)
  }
}

// Clear cache when filters change significantly
export const clearParkingDataCache = () => {
  requestCache.clear();
  // console.log('Parking data cache cleared');
};

export const initUpdateParkingData = (_store) => {
  store_parkingdata = _store;
  if(! store_parkingdata) { console.log('No store yet.'); return; }
  if(timerid_parkingdata) { clearTimeout(timerid_parkingdata); }
  updateParkingData();
}
