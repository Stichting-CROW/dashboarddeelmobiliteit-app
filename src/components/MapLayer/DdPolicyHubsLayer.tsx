import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom'
import EventsTimeline from '../EventsTimeline/EventsTimeline';
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import {StateType} from '../../types/StateType.js';

import {
  fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);
  const [serviceAreaDelta, setServiceAreaDelta] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);

  // If gebied or visible_layers is updated:
  useEffect(() => {
    if(! filter.gebied) return;
    if(! visible_layers || visible_layers.length === 0) return;

    // Fetch hubs
    fetch_hubs({
      token: token,
      municipality: filter.gebied,
      visible_layers: visible_layers
    })
  }, [
    filter.gebied,
    visible_layers.length
  ]);

  //   // Fetch service areas history and store in state
  //   (async () => {
  //     const res = await fetchServiceAreasHistory();
  //     setServiceAreasHistory(res);
  //   })();
  // }, [
  //   filter.gebied
  // ]);

  // // onComponentUnLoad
  // useEffect(() => {
  //   return () => {
  //     console.log('removeServiceAreasFromMap')
  //     removeServiceAreasFromMap(map);
  //   };
  // }, [
  // ]);

  return <PolicyHubsPhaseMenu />
}

export default DdPolicyHubsLayer;
