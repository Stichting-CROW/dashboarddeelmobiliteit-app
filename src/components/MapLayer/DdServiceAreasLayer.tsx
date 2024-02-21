import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EventsTimeline from '../EventsTimeline/EventsTimeline';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import {renderServiceAreas} from '../Map/MapUtils/map.service_areas';

import {StateType} from '../../types/StateType.js';

const DdServiceAreasLayer = ({
  map
}): JSX.Element => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);

  const dispatch = useDispatch()

  const displayMode = useSelector((state: StateType) => state.layers ? state.layers.displaymode : DISPLAYMODE_PARK);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');
  const filter = useSelector((state: StateType) => state.filter || null);
  const stateLayers = useSelector((state: StateType) => state.layers || null);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // onComponentLoad
  useEffect(() => {
    // Fetch service areas and store in state
    (async () => {
      const res = await fetchServiceAreas();
      setServiceAreas(res);
    })();

    // Fetch service areas history and store in state
    (async () => {
      const res = await fetchServiceAreasHistory();
      setServiceAreasHistory(res);
      console.log('serviceAreasHistory', res)
    })();

    // onComponentUnLoad
    return () => {

    };
  }, [
    filter.gebied
  ]);

  // Do things if 'serviceAreas' change
  useEffect(() => {
    // Return if no service areas were found
    if(! serviceAreas || ! serviceAreas[0]) return;
    
    // Get the service area of the selected municipality
    const serviceAreasForMunicipality = serviceAreas.filter(x => x.municipality === filter.gebied).pop();

    // Return if no service areas were found for this municipality
    if(! serviceAreasForMunicipality) return;

    renderServiceAreas(map, serviceAreasForMunicipality.geometries);

    // onComponentUnLoad
    return () => {

    };
  }, [
    serviceAreas
  ]);

  // Do things if 'serviceAreasHistory' changes
  useEffect(() => {
    // Return if no service areas were found
    if(! serviceAreasHistory) return;
    
    populateHistoryTimeline(serviceAreasHistory);

    // onComponentUnLoad
    return () => {

    };
  }, [
    serviceAreasHistory
  ]);

  // Function that gets service areas
  const fetchServiceAreas = async () => {
    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area?municipalities=${filter.gebied}&operators=check`;
    const response = await fetch(url);
    const json = await response.json();

    return json;
  }

  // Function that gets service areas
  const fetchServiceAreasHistory = async () => {
    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area/history?municipalities=${filter.gebied}&operators=check&start_date=2024-01-01&end_date=2024-03-01`;
    const response = await fetch(url);
    const json = await response.json();

    return json;
  }

  const populateHistoryTimeline = (history: any) => {
    if(! history || history.constructor !== Array) return;

    const uniqueDates = history.map(x => x.valid_from);
    
    // setHistoryEventDates()
    // TODO: Remove this function & pass history to EventsTimeline component
  }

  return <>
    <div style={{
        position: 'fixed',
        bottom: '100px',
        left: '360px'
      }}>
        {/* <EventsTimeline></EventsTimeline> */}
      </div>
  </>
}

export default DdServiceAreasLayer;
