// import moment from 'moment';
import {
  createFilterparameters,
  convertDistanceToBin,
  abortableFetch
} from './pollTools.js';
import {isLoggedIn} from '../helpers/authentication.js';
import {shouldFetchVehicles} from './pollTools.js';

import { DISPLAYMODE_RENTALS } from '../reducers/layers.js';
const md5 = require('md5');

var store_verhuringendata = undefined;
var timerid_verhuringendata = undefined;

// Variable that will prevent simultaneous loading of fetch requests
let theFetch = null;

// Variable to keep track of vehicles response
// Only do a new fetch() if needed
let activeRentals;

// Variable to keep track of filter changes
// Only do a new fetch() if needed
let existingFilter;

const processRentalsResult = (state, type, rentals) => {
  activeRentals = rentals;

  let geoJson = {
    "type":"FeatureCollection",
    "features":[]
  }
  
  let operatorstats = {}
  state.metadata.aanbieders.forEach(o => {
    operatorstats[o.system_id || o.value]=0;
  });

  let aanbiedersexclude = state.filter.aanbiedersexclude.split(",") || []

  // Map data
  activeRentals[`trip_${type}`].forEach(v => {
    const distance_bin = convertDistanceToBin(v.distance_in_meters);

    let feature = {
     "type":"Feature",
     "properties":{
        "id": md5(v.location.latitude+v.location.longitude),
        "system_id": v.system_id,
        "form_factor": v.form_factor || null,
        "arrival_time": v.arrival_time,
        "departure_time": v.departure_time,
        "distance_bin": distance_bin,
        "distance_in_meters": v.distance_in_meters,
        // "duration_bin": 0,
        // "color": "#38ff71" // color
     },
     "geometry":{
        "type":"Point",
        "coordinates": [
           v.location.longitude,
           v.location.latitude,
           0.0
        ]
      }
    }

    operatorstats[v.system_id || v.value]+=1;

    let afstandexclude = state.filter.afstandexclude.split(",") || [];
    let markerVisible = !afstandexclude.includes(distance_bin.toString());
    markerVisible = markerVisible && (aanbiedersexclude.includes(v.system_id || v.value) === false)
    if(markerVisible) {
      geoJson.features.push(feature);
    }

  })

  store_verhuringendata.dispatch({
    type: `SET_RENTALS_${type.toUpperCase()}`,
    payload: geoJson
  })
  
  store_verhuringendata.dispatch({
    type: `SET_RENTALS_${type.toUpperCase()}_OPERATORSTATS`,
    payload: operatorstats
  })
}

const doApiCall = (
  state,
  type,
  callback
) => {

  const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;

  if(type !== 'destinations' && type !== 'origins') {
    console.error('No valid type given to fetchData');
    return;
  }

  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/v2/trips/${type}`;
  let options = {};
  if(null!==state.filter&&null!==state.authenticationdata) {
    url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/v2/trips/${type}`;
    let filterparams = createFilterparameters(DISPLAYMODE_RENTALS, state.filter, state.metadata);
    if(filterparams.length>0) {
      url += "?" + filterparams.join("&");
    }
    options = {
      headers : { "authorization": "Bearer " + state.authentication.user_data.token }
    }
  }
  
  store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: true});
  
  // Abort previous fetch
  if(theFetch) {
    theFetch.abort()
  }
  // Now do a new fetch
  theFetch = abortableFetch(url, options);
  theFetch.ready.then(function(response) {
    // Set theFetch to null, so next request is not aborted
    theFetch = null;

    store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: false});

    if(!response.ok) {
      console.error("unable to fetch: %o", response);
      return false
    }

    response.json().then(function(data) {
      const rentals = isLoggedIn ? data : [];
      callback(state, type, rentals);
    }).catch(ex=>{
      console.error("unable to decode JSON");
    }).finally(()=>{
      store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: false});
    })
    
  }).catch(ex=>{
    store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: false});
    console.error("fetch error - unable to fetch JSON from %s", url);
  });

}

// Function that gets trip data and saves it into store_verhuringendata
const updateVerhuringenData = ()  => {
  try {
    if(undefined===store_verhuringendata) {
      // console.error("no redux state available yet - skipping zones update");
      return false;
    }
    
    // Wait for zone data
    const state = store_verhuringendata.getState();
    if(state.layers.displaymode!==DISPLAYMODE_RENTALS) {
      // console.log(`not viewing rentals data (viewing ${state.layers.displaymode}, need ${DISPLAYMODE_RENTALS}) - skip update`);
      return true;
    }

    if(state.metadata.zones_loaded===false) {
      // console.log("no zone metadata available yet - skipping rentals data update");
      return false;
    }

    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;

    if(!canfetchdata) {
      store_verhuringendata.dispatch({ type: 'CLEAR_RENTALS_ORIGINS'});
      store_verhuringendata.dispatch({ type: 'CLEAR_RENTALS_DESTINATIOINS'});
    } else {

      // Should we (re)fetch vehicles?
      const doFetchRentals = shouldFetchVehicles(state.filter, existingFilter);

      // Update active filter
      existingFilter = state.filter;

      const theType = state.filter.herkomstbestemming === 'bestemming' ? 'destinations' : 'origins';
      if(doFetchRentals || ! activeRentals) {
        doApiCall(state, theType, processRentalsResult);
      } else {
        // Regenerate geoJson without querying API
        processRentalsResult(state, theType, activeRentals); 
      }

    }
  } catch(ex) {
    console.error("Unable to update zones", ex)
  } finally {
    // store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: false});
  }
}

export const forceUpdateVerhuringenData = () => {
  if(! store_verhuringendata) { console.log('No store yet.'); return; }
  if(undefined!==timerid_verhuringendata) { clearTimeout(timerid_verhuringendata); }
  updateVerhuringenData();
}

export const initUpdateVerhuringenData = (_store) => {
  store_verhuringendata = _store;
  forceUpdateVerhuringenData();
}
