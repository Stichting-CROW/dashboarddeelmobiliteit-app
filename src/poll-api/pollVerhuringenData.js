// import moment from 'moment';
import { createFilterparameters, isLoggedIn, convertDistanceToBin } from './pollTools.js';
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
      console.error("no redux state available yet - skipping zones update");
      return false;
    }

    // Wait for zone data
    const state = store_verhuringendata.getState();
    if(state.layers.displaymode!==DISPLAYMODE_RENTALS) {
      // console.log(`not viewing rentals data (viewing ${state.layers.displaymode}, need ${DISPLAYMODE_RENTALS}) - skip update`);
      return true;
    }
    if(state.metadata.zones_loaded===false) {
      delay = cPollDelayLoading;
      // console.log("no zone metadata available yet - skipping rentals data update");
      return false;
    }

    let afstandexclude = state.filter.afstandexclude.split(",") || [];
    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
    if(!canfetchdata) {
      store_verhuringendata.dispatch({ type: 'CLEAR_RENTALS_ORIGINS'});
      store_verhuringendata.dispatch({ type: 'CLEAR_RENTALS_DESTINATIOINS'});
    } else {
      const fetchData = (key) => {
        if(key !== 'destinations' && key !== 'origins') {
          console.error('No valid key given to fetchData');
          return;
        }
        let url = `https://api.deelfietsdashboard.nl/dashboard-api/v2/trips/${key}`;
        let options = {};
        if(null!==state.filter&&null!==state.authenticationdata) {
          url = `https://api.deelfietsdashboard.nl/dashboard-api/v2/trips/${key}`;
          let filterparams = createFilterparameters(DISPLAYMODE_RENTALS, state.filter, state.metadata);
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

            let geoJson = {
              "type":"FeatureCollection",
              "features":[]
            }

            // Map data
            verhuringen[`trip_${key}`].forEach(v => {
              const distance_bin = convertDistanceToBin(v.distance_in_meters);

              let feature = {
               "type":"Feature",
               "properties":{
                  "id": md5(v.location.latitude+v.location.longitude),
                  "system_id": v.system_id,
                  "arrival_time": v.arrival_time,
                  "departure_time": v.departure_time,
                  "distance_bin": distance_bin,
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

              let markerVisible = !afstandexclude.includes(distance_bin.toString());
              if(markerVisible) {
                geoJson.features.push(feature);
              }

            })

            store_verhuringendata.dispatch({
              type: `SET_RENTALS_${key.toUpperCase()}`,
              payload: geoJson
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

      if(state.filter.herkomstbestemming === 'bestemming') {
        fetchData('destinations');
      } else {
        fetchData('origins');
      }
    }
  } catch(ex) {
    console.error("Unable to update zones", ex)
    delay = cPollDelayVerhuringenData * cPollDelayErrorMultiplyer;
  } finally {
    // timerid_verhuringendata = setTimeout(updateVerhuringenData, delay);
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
