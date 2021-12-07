// import moment from 'moment';
import { createFilterparameters, isLoggedIn } from './pollTools.js';
import { cPollDelayVerhuringenData, cPollDelayErrorMultiplyer } from '../constants.js';

var store_verhuringendata = undefined;
var timerid_verhuringendata = undefined;

// Function that gets trip data and saves it into store
const updateVerhuringenData = ()  => {
  let delay = cPollDelayVerhuringenData;
  try {
    if(undefined===store_verhuringendata) {
      console.log("no redux state available yet - skipping zones update");
      return false;
    }

    const state = store_verhuringendata.getState();
    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
    if(!canfetchdata) {
      store_verhuringendata.dispatch({ type: 'SET_VERHUURDATA', payload: []});
    } else {
      let url = "https://api.deelfietsdashboard.nl/dashboard-api/rentals";
      // ?start_time=2021-12-06T09:15:00Z&end_time=2021-12-07T09:15:00Z&operators=cykl,flickbike,donkey,mobike,htm,gosharing,check,felyx,deelfietsnederland,keobike,lime,baqme,cargoroo,uwdeelfiets,hely&zone_ids=34217
      let options = {};
      if(null!==state.filter&&null!==state.authenticationdata) {
        url = "https://api.deelfietsdashboard.nl/dashboard-api/rentals";
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
        
        response.json().then(function(data) {
          console.log("update verhuringen data - response json", data)
          // return;
          
          let verhuringen = [];
          if(isLoggedIn) {
            verhuringen = data.verhuringen
          }
          let geoJson = {
             "type":"FeatureCollection",
             "features":[]
          }
      
          // const md5 = require('md5');
          // var current_time = moment();
          // verhuringen.start_rentals / verhuringen.end_rentals
          verhuringen.start_rentals.forEach(v => {
            
            // ***********************************
            // TODO
            // ***********************************
            
            // // let in_public_space_since = isLoggedIn ? v.start_time : v.in_public_space_since;
            // //
            // // var minutes = current_time.diff(moment(in_public_space_since), 'minutes');
            // // const color = convertDurationToColor(minutes);
            //
            // // {
            // //     "bike_id": "check:e2b733e9-ac8f-459e-9904-19775ff730d7",
            // //     "end_location": {
            // //         "latitude": 51.92392,
            // //         "longitude": 4.46867
            // //     },
            // //     "end_time": "2021-11-01T18:13:01.927898Z",
            // //     "start_location": {
            // //         "latitude": 51.91227,
            // //         "longitude": 4.46921
            // //     },
            // //     "start_time": "2021-11-01T17:52:31.595659Z",
            // //     "system_id": "check",
            // //     "trip_id": 17179722
            // // }
            //
            // let feature = {
            //    "type":"Feature",
            //    "properties":{
            //       "id":md5(v.start_location.latitude+v.start_location.longitude),
            //       "system_id": v.system_id,
            //       // "in_public_space_since": in_public_space_since,
            //       "color": "#38ff71" // color
            //    },
            //    "geometry":{
            //       "type":"Point",
            //       "coordinates":[
            //          v.start_location.longitude,
            //          v.start_location.latitude,
            //          0.0
            //       ]
            //    }
            // }
            //
            // geoJson.features.push(feature);
            //
            // let feature2 = {
            //    "type":"Feature",
            //    "properties":{
            //       "id":md5(v.end_location.latitude+v.end_location.longitude),
            //       "system_id": v.system_id,
            //       // "in_public_space_since": in_public_space_since,
            //       "color": "#cc0000" // color
            //    },
            //    "geometry":{
            //       "type":"Point",
            //       "coordinates":[
            //          v.end_location.longitude,
            //          v.end_location.latitude,
            //          0.0
            //       ]
            //    }
            // }
            //
            // geoJson.features.push(feature2);
            // // new maplibregl.Marker({color: "#FF0000"})
            // //   .setLngLat([x.location.longitude, x.location.latitude])
            // //   .addTo(map.current);
            // //
            // // return;
            
            // ***********************************
            // END TODO
            // ***********************************
          })
      
          store_verhuringendata.dispatch({
            type: 'SET_VERHURINGEN',
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
