// import moment from 'moment';
import {
  createFilterparameters,
  convertDistanceToBin,
  abortableFetch
} from './pollTools.js';
import {isLoggedIn, isAdmin} from '../helpers/authentication.js';
import {shouldFetchVehicles} from './pollTools.js';

import { DISPLAYMODE_RENTALS } from '../reducers/layers.js';

var store_verhuringendata = undefined;
var timerid_verhuringendata = undefined;

// Variable that will prevent simultaneous loading of fetch requests
let theFetch = null;

// URL of the request currently in flight, so an identical request can reuse
// it instead of aborting and starting over (see doApiCall)
let theFetchUrl = null;

// Variable to keep track of vehicles response
// Only do a new fetch() if needed
let activeRentals;

// Variable to keep track of filter changes
// Only do a new fetch() if needed
let existingFilter;

const processRentalsResult = (state, type, rentals) => {
  // Don't overwrite imported CSV data ('Ruwe data import') with API data
  const currentState = store_verhuringendata.getState();
  if(currentState.rentals && currentState.rentals.csv_data) {
    return;
  }

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
        "id": v.location.latitude+","+v.location.longitude,
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

// Render imported CSV data ('Ruwe data import') instead of API data.
// The CSV contains park_events without trip distance, so the afstand filter
// does not apply; aanbieders- and voertuigtype-filters are applied client-side.
const processCsvRentalsResult = (state, csvData) => {
  let geoJson = {
    "type":"FeatureCollection",
    "features":[]
  }

  let operatorstats = {}
  state.metadata.aanbieders.forEach(o => {
    operatorstats[o.system_id || o.value]=0;
  });

  const aanbiedersexclude = state.filter.aanbiedersexclude.split(",") || [];
  const voertuigtypesexclude = (state.filter.voertuigtypesexclude || '').split(",");

  csvData.rows.forEach(v => {
    let feature = {
     "type":"Feature",
     "properties":{
        "id": md5(`${v.lat}${v.lon}`),
        "system_id": v.system_id,
        "form_factor": v.form_factor || null,
        "arrival_time": v.start_time,
        "departure_time": v.end_time,
        "distance_bin": 0,
        "distance_in_meters": null
     },
     "geometry":{
        "type":"Point",
        "coordinates": [
           v.lon,
           v.lat,
           0.0
        ]
      }
    }

    if(operatorstats[v.system_id] === undefined) {
      operatorstats[v.system_id] = 0;
    }
    operatorstats[v.system_id] += 1;

    let markerVisible = aanbiedersexclude.includes(v.system_id) === false;
    markerVisible = markerVisible && (!v.form_factor || voertuigtypesexclude.includes(v.form_factor) === false);
    if(markerVisible) {
      geoJson.features.push(feature);
    }
  })

  // Fill both origins and destinations, so the imported data is visible
  // in every rentals layer (points, clusters, heat map), regardless of
  // the herkomst/bestemming setting
  ['ORIGINS', 'DESTINATIONS'].forEach(type => {
    store_verhuringendata.dispatch({
      type: `SET_RENTALS_${type}`,
      payload: geoJson
    })
    store_verhuringendata.dispatch({
      type: `SET_RENTALS_${type}_OPERATORSTATS`,
      payload: operatorstats
    })
  })
}

const doApiCall = (
  state,
  type,
  callback
) => {

  const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
  const is_admin = isAdmin(state);

  if(type !== 'destinations' && type !== 'origins') {
    console.error('No valid type given to fetchData');
    return;
  }

  let url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/v2/trips/${type}`;
  let options = {};
  if (canfetchdata) {
    let filterparams = createFilterparameters(DISPLAYMODE_RENTALS, state.filter, state.metadata, {
      show_global: is_admin,
      is_logged_in: isLoggedIn(state)
    });
    if (filterparams.length > 0) {
      url += "?" + filterparams.join("&");
    }
    options = {
      headers: { authorization: "Bearer " + state.authentication.user_data.token }
    };
  }
  
  // If a request for this exact URL is already in flight, let it finish
  // instead of aborting and re-issuing it: the response is processed with the
  // then-current store state, so the result is the same either way.
  if(theFetch && theFetchUrl === url) {
    return;
  }

  store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: true});

  // Abort previous fetch
  if(theFetch) {
    theFetch.abort()
  }
  // Now do a new fetch
  const thisFetch = abortableFetch(url, options);
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

  thisFetch.ready.then(function(response) {
    if(!response.ok) {
      clearFetchTracking();
      store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: false});
      console.error("unable to fetch: %o", response);
      return false
    }

    response.json().then(function(data) {
      const rentals = isLoggedIn ? data : [];
      // Process with the *current* store state (not the state at request
      // time), so client-side filters that changed while the request was in
      // flight are applied to the result.
      callback(store_verhuringendata.getState(), type, rentals);
    }).catch(ex=>{
      console.error("unable to decode JSON");
    }).finally(()=>{
      clearFetchTracking();
      store_verhuringendata.dispatch({type: 'SHOW_LOADING', payload: false});
    })

  }).catch(ex=>{
    // If this request was aborted because a newer one replaced it, leave the
    // loading state to the newer request
    if(theFetch !== thisFetch) return;
    clearFetchTracking();
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

    // If CSV data was imported ('Ruwe data import'): render that instead of API data
    if(state.rentals && state.rentals.csv_data) {
      // Abort any in-flight API fetch, so it can't overwrite the imported data
      if(theFetch) {
        theFetch.abort();
        theFetch = null;
      }
      processCsvRentalsResult(state, state.rentals.csv_data);
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
      if(doFetchRentals || (! activeRentals && ! theFetch)) {
        doApiCall(state, theType, processRentalsResult);
      } else if(activeRentals) {
        // Regenerate geoJson without querying API
        processRentalsResult(state, theType, activeRentals);
      }
      // else: no rentals yet but a fetch is in flight; its callback processes
      // the response with the store state at completion time

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
