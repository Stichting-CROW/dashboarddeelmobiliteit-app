import moment from 'moment';
import { createFilterparameters, isLoggedIn, convertDurationToColor } from './pollTools.js';

var store_parkingdata = undefined;

var timerid_parkingdata = undefined;

var recursive = 0;

const updateParkingData = ()  => {
  recursive += 1;
  if(recursive>1) {
    console.log("recursive updateparkingdata call (level %s)", recursive);
    return false;
  }

  // console.log("updateParkingData")
  let delay = 5 * 1000;
  try {
    if(undefined===store_parkingdata) {
      // console.log("no redux state available yet - skipping zones update");
      return false;
    }
    
    const state = store_parkingdata.getState();
    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
    if(!canfetchdata) {
      store_parkingdata.dispatch({type: 'SET_PARKINGDATA', payload: []});
    } else {
      let url = "https://api.deelfietsdashboard.nl/dashboard-api/public/vehicles_in_public_space";
      let options = {};
      if(null!==state.filter&&null!==state.authenticationdata) {
        // url = "https://api.deelfietsdashboard.nl/dashboard-api/park_events?timestamp=2021-10-22T15:46:20Z"+aanbiedersfilter; // + "&zone_ids=34234";
        url = "https://api.deelfietsdashboard.nl/dashboard-api/park_events";
        let filterparams = createFilterparameters(true, state.filter, state.metadata);
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
        
        response.json().then(function(vehicles) {
          if(isLoggedIn) {
            vehicles = vehicles.park_events
          }
          let geoJson = {
             "type":"FeatureCollection",
             "features":[]
          }
      
          const md5 = require('md5');
          var current_time = moment();
          vehicles.forEach(v => {
            let in_public_space_since = isLoggedIn ? v.start_time : v.in_public_space_since;
      
            var minutes = current_time.diff(moment(in_public_space_since), 'minutes');
            const color = convertDurationToColor(minutes);
      
            let feature = {
               "type":"Feature",
               "properties":{
                  "id":md5(v.location.latitude+v.location.longitude),
                  "system_id": v.system_id,
                  "in_public_space_since": in_public_space_since,
                  "color": color
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
      
            geoJson.features.push(feature);
            // new maplibregl.Marker({color: "#FF0000"})
            //   .setLngLat([x.location.longitude, x.location.latitude])
            //   .addTo(map.current);
            //
            // return;
          })
      
          store_parkingdata.dispatch({
            type: 'SET_VEHICLES',
            payload: geoJson
          })
      
          // setJson(json);
          // setTimestamp(new Date());
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
    delay = 5 * 1000;
  } finally {
    recursive -= 1;
    timerid_parkingdata = setTimeout(updateParkingData, delay);
  }
}

export const forceUpdateParkingData = () => {
  if(undefined!==timerid_parkingdata) { clearTimeout(timerid_parkingdata); }
  updateParkingData();
}

export const initUpdateParkingData = (_store) => {
  // console.log("initUpdateParkingData")
  store_parkingdata = _store;
  forceUpdateParkingData();
}