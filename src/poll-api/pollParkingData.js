import moment from 'moment';
import {
  createFilterparameters,
  convertDurationToBin,
  abortableFetch
} from './pollTools.js';
import { isLoggedIn } from '../helpers/authentication.js';
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

  const canfetchdata = state && isLoggedIn(state)  && state.filter && state.authentication.user_data.token;

  // Set API URL
  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/vehicles_in_public_space`;

  let options = {};
  let filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata, {
    show_global: true
  });

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

    // Should we (re)fetch vehicles?
    const doFetchVehicles = shouldFetchVehicles(state.filter, existingFilter);

    // Update active filter
    existingFilter = state.filter;

    if(doFetchVehicles || ! activeVehicles) {
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

export const initUpdateParkingData = (_store) => {
  store_parkingdata = _store;
  if(! store_parkingdata) { console.log('No store yet.'); return; }
  if(timerid_parkingdata) { clearTimeout(timerid_parkingdata); }
  updateParkingData();
}
