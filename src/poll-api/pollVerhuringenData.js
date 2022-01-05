// import moment from 'moment';
import { createFilterparameters, isLoggedIn } from './pollTools.js';
import { cPollDelayVerhuringenData, cPollDelayErrorMultiplyer, cPollDelayLoading } from '../constants.js';
import { DISPLAYMODE_RENTALS } from '../reducers/layers.js';
const md5 = require('md5');

var store_verhuringendata = undefined;
var timerid_verhuringendata = undefined;

// Function that gets trip data and saves it into store_verhuringendata
const updateVerhuringenData = ()  => {
  let delay = cPollDelayVerhuringenData;
  try {
    if(undefined===store_verhuringendata) {
      // console.log("no redux state available yet - skipping zones update");
      return false;
    }

    // Wait for zone data
    const state = store_verhuringendata.getState();
    // if(state.layers.displaymode!==DISPLAYMODE_RENTALS) {
    //   console.log('not viewing rentals data - skip update');
    //   return true;
    // }
    if(state.metadata.zones_loaded===false) {
      delay = cPollDelayLoading;
      // console.log("no zone metadata available yet - skipping parking data update");
      return false;
    }

    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
    if(!canfetchdata) {
      store_verhuringendata.dispatch({ type: 'CLEAR_RENTALS_ORIGINS'});
      store_verhuringendata.dispatch({ type: 'CLEAR_RENTALS_DESTINATIOINS'});
    } else {
      let url = "https://api.deelfietsdashboard.nl/dashboard-api/rentals";
      // ?start_time=2021-12-06T09:15:00Z&end_time=2021-12-07T09:15:00Z&operators=cykl,flickbike,donkey,mobike,htm,gosharing,check,felyx,deelfietsnederland,keobike,lime,baqme,cargoroo,uwdeelfiets,hely&zone_ids=34217
      let options = {};
      if(null!==state.filter&&null!==state.authenticationdata) {
        url = "https://api.deelfietsdashboard.nl/dashboard-api/rentals";
        let filterparams = createFilterparameters(false, state.filter, state.metadata);
        if(filterparams.length>0) {
          url += "?" + filterparams.join("&");
        }
        options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
      }
      fetch(url, options).then(function(response) {
        if(!response.ok) {
          console.error("unable to fetch: %o", response);
          return false
        }
        
        response.json().then(function(data) {
          let verhuringen = isLoggedIn ? data : [];

          // generateGeoJsonForVerhuringen :: type ENUM 'start_rentals'|'end_rentals'
          const generateGeoJsonForVerhuringen = (dataObject, type) => {
            // Validation
            if(! dataObject) return;
            if(! type || (type !== 'start_rentals' && type !== 'end_rentals')) {
              console.error('Type is invalid. Type is: ', type)
              return;
            }

            let geoJson = {
              "type":"FeatureCollection",
              "features":[]
            }

            // Map data
            dataObject[type].forEach(v => {
              let feature = {
                 "type":"Feature",
                 "properties":{
                    "id": md5(v.location.latitude+v.location.longitude),
                    "system_id": v.system_id,
                    "arrival_time": v.arrival_time,
                    "departure_time": v.departure_time,
                    "duration_bin": 0,
                    "color": "#38ff71" // color
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
              geoJson.features.push(feature);
            })

            return geoJson;
          }

          store_verhuringendata.dispatch({
            type: 'SET_RENTALS_ORIGINS',
            payload: generateGeoJsonForVerhuringen(verhuringen, 'start_rentals')
          })
        
          store_verhuringendata.dispatch({
            type: 'SET_RENTALS_DESTINATIONS',
            payload: generateGeoJsonForVerhuringen(verhuringen, 'end_rentals')
          })
        
        }).catch(ex=>{
          console.error("unable to decode JSON");
          // setJson(false);
        });
      }).catch(ex=>{
        console.error("fetch error - unable to fetch JSON from %s", url);
        // setJson(false);
      });
    }
  } catch(ex) {
    console.error("Unable to update zones", ex)
    delay = cPollDelayVerhuringenData * cPollDelayErrorMultiplyer;
  } finally {
    timerid_verhuringendata = setTimeout(updateVerhuringenData, delay);
  }
}

export const forceUpdateVerhuringenData = () => {
  if(undefined!==timerid_verhuringendata) { clearTimeout(timerid_verhuringendata); }
  updateVerhuringenData();
}

export const initUpdateVerhuringenData = (_store) => {
  // console.log("initUpdateVerhuringenData")
  store_verhuringendata = _store;
  forceUpdateVerhuringenData();
}
