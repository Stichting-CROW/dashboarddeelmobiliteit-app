import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';
import moment from 'moment';

import {fetchParkEvents} from '../helpers/parkEvents.js';

const numberOfSnapshots = 4*5;//4*5
const provider = 'htm';//4*5
let numberOfUniqueVehiclesAfterXIterations = [];

const getUniqueVehicleIds = (dataset) => {
  let uniqueVehicleIds = [];
  dataset.map(x => {
    if(uniqueVehicleIds.indexOf(x.bike_id) <= -1) {
      uniqueVehicleIds.push(x.bike_id);
    }
    return x;
  });
  return uniqueVehicleIds;
}

function Monitoring(props) {

  // Get state.authentication
  const authentication = useSelector(state => {
    return state.authentication ? state.authentication : false;
  });

  // On load, get parking data of different moments in time
  useEffect((x) => {
    // Function that gets parking data for a specific provider, for a specific date/time
    const fetchMultipleMomentsInTime = async () => {
      let dateTime = moment().toISOString(), parkEvents = [];
      // Get 4*5=20 snapshots (= 5 days) of parking data
      let collectedParkEvents = [];
      for(let i = 0; i <= numberOfSnapshots; i++) {
        dateTime = moment(dateTime).subtract(6, 'hours').toISOString();
        // Get park events for date time
        parkEvents = await fetchParkEvents(authentication, provider, dateTime);
        // Add park events to existing allParkEvents array
        parkEvents.map(x => {
          collectedParkEvents.push(x);
          return x;
        });
        // Get cumulative unique vehicle IDs
        numberOfUniqueVehiclesAfterXIterations[i] = getUniqueVehicleIds(collectedParkEvents);
      }
      return collectedParkEvents;
    }

    fetchMultipleMomentsInTime();
  }, [authentication]);

  return (
    <div className="mt-12">
      <h1 className="text-2xl my-2">
        Monitoring
      </h1>

      <p className="py-2">
        Voor {provider} willen we controleren hoeveel unieke voertuig-IDs er zijn door te de tijd heen.
      </p>

      <p className="py-2">
        Op deze manier kunnen we afleiden of er aan de standaard wordt voldaan. Er moeten statische voertuig-IDs zijn. Als dit niet het geval is, zul je zien dat er na verloop van tijd veel meer voertuig-IDs zijn geregistreerd dan het aantal voertuigen dat de aanbieder heeft. Op die manier weet je dat denog niet voldaan wordt aan de gevraagde datastandaard.
      </p>

      <p className="py-2">
        De snapshots zijn steeds gemaakt met 6 uur ertussen.
      </p>

      <pre>
        {numberOfUniqueVehiclesAfterXIterations ? numberOfUniqueVehiclesAfterXIterations.map((val, key) => {
          return <div key={key}>Number of UUIDs after <b>{key} snapshots</b>: <b>{val.length}</b></div>
        }) : ''}
      </pre>

      <table className="table-auto bg-white hidden">
        <thead>
          <tr>
            <th>Datum/tijd</th>
            <th>Cumulatief aantal voertuig-IDs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>datumtijd</td>
            <td>aantal</td>
          </tr>
        </tbody>
      </table>

    </div>
  );
  
  
}

export default Monitoring;
