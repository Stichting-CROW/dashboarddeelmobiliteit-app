// import moment from 'moment';
import { createFilterparameters, isLoggedIn } from './pollTools.js';
import { cPollDelayTripData, cPollDelayErrorMultiplyer } from '../constants.js';
import { DISPLAYMODE_RENTALS } from '../reducers/layers.js';

var store_tripdata = undefined;
var timerid_tripdata = undefined;

// Function that gets trip data and saves it into store
const updateTripData = ()  => {
  // No trip data needed
  return;

  let delay = cPollDelayTripData;
  try {
    if(undefined===store_tripdata) {
      console.log("no redux state available yet - skipping zones update");
      return false;
    }

    const state = store_tripdata.getState();
    const canfetchdata = isLoggedIn(state)&&state&&state.filter&&state.authentication.user_data.token;
    if(!canfetchdata) {
      store_tripdata.dispatch({ type: 'SET_TRIPDATA', payload: []});
    } else {
      let url = "https://api.deelfietsdashboard.nl/dashboard-api/public/trips_in_public_space";
      let options = {};
      if(null!==state.filter&&null!==state.authenticationdata) {
        url = "https://api.deelfietsdashboard.nl/dashboard-api/trips";
        // TODO: check if the filter parameters are Ok for this dataset
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
          // console.log(data);
          // return;
          
          let trips = [];
          if(isLoggedIn) {
            trips = data.trips
          }
          let geoJson = {
             "type":"FeatureCollection",
             "features":[]
          }
      
          const md5 = require('md5');
          // var current_time = moment();
          trips.forEach(t => {
            // let in_public_space_since = isLoggedIn ? v.start_time : v.in_public_space_since;
            //
            // var minutes = current_time.diff(moment(in_public_space_since), 'minutes');
            // const color = convertDurationToColor(minutes);
            
            // {
            //     "bike_id": "check:e2b733e9-ac8f-459e-9904-19775ff730d7",
            //     "end_location": {
            //         "latitude": 51.92392,
            //         "longitude": 4.46867
            //     },
            //     "end_time": "2021-11-01T18:13:01.927898Z",
            //     "start_location": {
            //         "latitude": 51.91227,
            //         "longitude": 4.46921
            //     },
            //     "start_time": "2021-11-01T17:52:31.595659Z",
            //     "system_id": "check",
            //     "trip_id": 17179722
            // }
      
            let feature = {
               "type":"Feature",
               "properties":{
                  "id":md5(t.start_location.latitude+t.start_location.longitude),
                  "system_id": t.system_id,
                  // "in_public_space_since": in_public_space_since,
                  "color": "#38ff71" // color
               },
               "geometry":{
                  "type":"Point",
                  "coordinates":[
                     t.start_location.longitude,
                     t.start_location.latitude,
                     0.0
                  ]
               }
            }
      
            geoJson.features.push(feature);

            let feature2 = {
               "type":"Feature",
               "properties":{
                  "id":md5(t.end_location.latitude+t.end_location.longitude),
                  "system_id": t.system_id,
                  // "in_public_space_since": in_public_space_since,
                  "color": "#cc0000" // color
               },
               "geometry":{
                  "type":"Point",
                  "coordinates":[
                     t.end_location.longitude,
                     t.end_location.latitude,
                     0.0
                  ]
               }
            }
      
            geoJson.features.push(feature2);
            // new maplibregl.Marker({color: "#FF0000"})
            //   .setLngLat([x.location.longitude, x.location.latitude])
            //   .addTo(map.current);
            //
            // return;
          })
      
          store_tripdata.dispatch({
            type: 'SET_TRIPS',
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
    delay = cPollDelayTripData * cPollDelayErrorMultiplyer;
  } finally {
    timerid_tripdata = setTimeout(updateTripData, delay);
  }
}

export const forceUpdateTripData = () => {
  if(undefined!==timerid_tripdata) { clearTimeout(timerid_tripdata); }
  updateTripData();
}

export const initUpdateTripData = (_store) => {
  // console.log("initUpdateTripData")
  store_tripdata = _store;
  forceUpdateTripData();
}
