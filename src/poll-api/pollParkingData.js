import moment from 'moment';
import { createFilterparameters, isLoggedIn, convertDurationToBin } from './pollTools.js';
import { cPollDelayParkingData, cPollDelayErrorMultiplyer, cPollDelayLoading } from '../constants.js';
import { DISPLAYMODE_PARK } from '../reducers/layers.js';

var store_parkingdata = undefined;

var timerid_parkingdata = undefined;

const updateParkingData = ()  => {
  // let delay = cPollDelayParkingData;
  try {
    if(undefined===store_parkingdata) {
      console.error("no redux state available yet - skipping zones update");
      return false;
    }
    
    // Wait for zone data
    const state = store_parkingdata.getState();
    if(state.metadata.zones_loaded===false) {
      // console.info("no zone metadata available yet - skipping parking data update");
      return false;
    }
    
    if(state.layers.displaymode!==DISPLAYMODE_PARK) {
      // console.info('not viewing park data - skip update');
      return true;
    }
    
    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
    let url = "https://api.deelfietsdashboard.nl/dashboard-api/public/vehicles_in_public_space";
    let options = {};
    if(!canfetchdata) {
      let filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata);
      if(filterparams.length>0) {
        url += "?" + filterparams.join("&");
      }
    } else {
      if(null!==state.filter&&null!==state.authenticationdata) {
        url = "https://api.deelfietsdashboard.nl/dashboard-api/park_events";
        let filterparams = createFilterparameters(DISPLAYMODE_PARK, state.filter, state.metadata);
        if(filterparams.length>0) {
          url += "?" + filterparams.join("&");
        }
        options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
      }
    }
    fetch(url, options).then(function(response) {
      if(!response.ok) {
        console.error("unable to fetch: %o", response);
        return false
      }
      
      response.json().then(function(vehicles) {
        if(isLoggedIn(state)) {
          vehicles = vehicles.park_events
        }
        let geoJson = {
           "type":"FeatureCollection",
           "features":[]
        }
        
        let operatorcolors = {};
        state.metadata.aanbieders.forEach(o => {
          operatorcolors[o.system_id || o.value]=o.color;
        });
    
        const md5 = require('md5');
        var start_time = moment(state.filter.datum);
        
        let parkeerduurexclude = state.filter.parkeerduurexclude.split(",") || [];

        vehicles.forEach(v => {
          let in_public_space_since = isLoggedIn(state) ? v.start_time : v.in_public_space_since;
    
          var minutes = start_time.diff(moment(in_public_space_since), 'minutes');
          const duration_bin = convertDurationToBin(minutes);
          
          let feature = {
             "type":"Feature",
             "properties":{
                "id":md5(v.location.latitude+v.location.longitude),
                "system_id": v.system_id || v.value,// v.value is used in the public map
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

          let markerVisible = !parkeerduurexclude.includes(duration_bin.toString());
          if(markerVisible) {
            geoJson.features.push(feature);
          }
        })
        // console.log('geoJson in pollParkingData', geoJson)
    
        store_parkingdata.dispatch({
          type: 'SET_VEHICLES',
          payload: geoJson
        })

      }).catch(ex=>{
        console.error("unable to decode JSON");
      });
    }).catch(ex=>{
      console.error("fetch error - unable to fetch JSON from %s", url);
    });
  } catch(ex) {
    console.error("Unable to update zones", ex)
    // delay = cPollDelayParkingData * cPollDelayErrorMultiplyer;
  } finally {
    // timerid_parkingdata = setTimeout(updateParkingData, delay);
  }
}

export const forceUpdateParkingData = () => {
  if(! store_parkingdata) { console.log('No store yet.'); return; }
  if(undefined!==timerid_parkingdata) { clearTimeout(timerid_parkingdata); }
  updateParkingData();
}

export const initUpdateParkingData = (_store) => {
  store_parkingdata = _store;
  forceUpdateParkingData();
}
