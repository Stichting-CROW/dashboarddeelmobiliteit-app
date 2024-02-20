import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import {StateType} from '../../types/StateType.js';

const DdServiceAreasLayer = ({
  map
}): JSX.Element => {
  const [serviceAreas, setServiceAreas] = useState([]);

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
    // Load service areas and store in state
    (async () => {
      const res = await fetchServiceAreas();

      setServiceAreas(res);
      console.log('The service areas are: ', res);
    })();

    // onComponentUnLoad
    return () => {

    };
  }, [
    filter.gebied,
    
  ]);

  // Function that gets service areas
  const fetchServiceAreas = async () => {
    const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area?municipalities=GM0518&municipalities=GM0599&operators=check`;
    const response = await fetch(url);
    const json = await response.json();

    return json;
  }

  return <></>
}

export default DdServiceAreasLayer;
