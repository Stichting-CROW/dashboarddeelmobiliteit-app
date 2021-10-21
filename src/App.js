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
  
  useInterval(() => {
      // Your custom logic here
      fetch(url).then(function(response) {
        response.json().then(function(json) {
          let vehicles = [];
          json.forEach(v=>{
            if(v.location) {
              vehicles.push({lat: v.location.latitude, lng: v.location.longitude});
            }
          })
          
          console.log("got %s vehicles", vehicles.length)
          
          // [{
          //   lng: 5.102406,
          //   lat: 52.0729252
          // }]
          //
          dispatch({
            type: 'SET_VEHICLES',
            payload: json
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
    }, 5000);
  
  
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
