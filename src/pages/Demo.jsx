import { useState } from 'react';

import logo from './logo.svg';
import useInterval from '../customHooks/useInterval.js';
import './Demo.css';

function Demo() {
  const url = "https://api.deelfietsdashboard.nl/dashboard-api/public/vehicles_in_public_space";
  
  let [json, setJson] = useState(false);
  let [timestamp, setTimestamp] = useState(false);
  
  useInterval(() => {
      // Your custom logic here
      fetch(url).then(function(response) {
        response.json().then(function(json) {
          setJson(json);
          setTimestamp(new Date());
        }).catch(ex=>{
          console.error("unable to decode JSON");
          setJson(false);
        });
      }).catch(ex=>{
        console.error("fetch error - unable to fetch JSON from %s", url);
        setJson(false);
      });
    }, 5000);
      
  return (
    <div className="Demo">
      <header className="Demo-header">
        <img src={logo} className="Demo-logo" alt="logo" />
        <p>
          Got {Object.keys(json).length} vehicles at {timestamp ? timestamp.toLocaleTimeString() : '-/-'}
        </p>
        <a
          className="Demo-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Demo;
