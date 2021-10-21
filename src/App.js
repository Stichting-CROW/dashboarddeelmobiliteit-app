import { useState } from 'react';
import {
 BrowserRouter as Router,
 Switch,
 Route
} from "react-router-dom";

import Menu from './components/Menu.jsx';
import Map from './pages/Map.jsx';
import Demo from './pages/Demo.jsx';
import Login from './pages/Login.jsx';

import { useDispatch } from 'react-redux';
import useInterval from './customHooks/useInterval.js';

import './App.css';

function App() {
  const url = "https://api.deelfietsdashboard.nl/dashboard-api/public/vehicles_in_public_space";
  const dispatch = useDispatch()
  
  // let [json, setJson] = useState(false);
  // let [timestamp, setTimestamp] = useState(false);

  const doSomething = () => {
    fetch(url).then(function(response) {
      response.json().then(function(vehicles) {
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
        vehicles.slice(0, 100).forEach(v => {
          let feature = {
             "type":"Feature",
             "properties":{
                "id":md5(v.location.latitude+v.location.longitude),
                "systemid": v.systemid,
                "in_public_space_since": v.in_public_space_since
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
        
        // [{
        //   lng: 5.102406,
        //   lat: 52.0729252
        // }]
        //
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
    doSomething();
  }, 30 * 1000);// every 30 seconds
  
  doSomething();
  setTimeout(() => {doSomething()}, 5000);
  
  return (
    <Router>
       <div className="App">
        <Menu />

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
