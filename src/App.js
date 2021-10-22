import { useEffect } from 'react';
import {
 BrowserRouter as Router,
 Switch,
 Route
} from "react-router-dom";

import Menu from './components/Menu.jsx';
import Map from './pages/Map.jsx';
import Demo from './pages/Demo.jsx';
import Login from './pages/Login.jsx';
import Filterbar from './components/Filterbar.jsx';
import moment from 'moment';

import { useSelector, useDispatch } from 'react-redux';
import useInterval from './customHooks/useInterval.js';

import './App.css';

function App() {
  const dispatch = useDispatch()
  
  
  // let [json, setJson] = useState(false);
  // let [timestamp, setTimestamp] = useState(false);
  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  const userdata = useSelector(state => {
    return state.authentication.user_data ;
  });

  const filter = useSelector(state => {
    if(!isLoggedIn||!state.filter)  {
      return null;
    }
    
    return state.filter;
  });

  const showfilter = useSelector(state => {
    return state.filter ? state.filter.visible : false;
  });

  const convertDurationToColor = (duration) => {
    if (duration <= 60) {
      return "#38ff71";
    }
    if (duration <= 24 * 60) {
      return "#008c28";
    }
    if (duration <= 24 * 60 * 4) {
      return "#fff700";
    }
    return "#cc0000";
  }

  let url = "https://api.deelfietsdashboard.nl/dashboard-api/public/vehicles_in_public_space";
  let options = {};
  if(null!==filter) {
    let aanbiedersfilter = filter.aanbieders!==""?"&operators=" + filter.aanbieders:"";
    
    let ts = new Date().toISOString().replace(/.\d+Z$/g, "Z"); // use current time without decimals
    // url = "https://api.deelfietsdashboard.nl/dashboard-api/park_events?timestamp=2021-10-22T15:46:20Z"+aanbiedersfilter; // + "&zone_ids=34234";
    url = "https://api.deelfietsdashboard.nl/dashboard-api/park_events?timestamp="+ts+aanbiedersfilter; // + "&zone_ids=34234";
    options = { headers : { "authorization": "Bearer " + userdata.token }}
  }

  const fetchVehiclesInPublicSpace = () => {
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
           "crs":{
              "type":"name",
              "properties":{
                 "name":"urn:ogc:def:crs:OGC:1.3:CRS84"
              }
           },
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
        
        dispatch({
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
  
  useInterval(() => {
    fetchVehiclesInPublicSpace();
  }, 30 * 1000);// every 30 seconds

  useEffect(x => {
    fetchVehiclesInPublicSpace();
  })
  

  return (
    <Router>
       <div className="App">
        <Menu />
        { isLoggedIn && showfilter ? <Filterbar /> : null }

         <Switch>
           <Route path="/demo">
            <Demo />
           </Route>
           <Route path="/login">
              <Login />
           </Route>
           <Route path="/">
            <Map />
           </Route>
         </Switch>
       </div>
     </Router>
  );
}

export default App;
