import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom'
import EventsTimeline from '../EventsTimeline/EventsTimeline';
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import {
  renderHubs,
  removeHubsFromMap
} from '../Map/MapUtils/map.policy_hubs';

import {StateType} from '../../types/StateType.js';

import {
  fetch_hubs
} from '../../helpers/policy-hubs/fetch-hubs'

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const [policyHubs, setPolicyHubs] = useState([]);

  const filter = useSelector((state: StateType) => state.filter || null);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);

  // If gebied or visible_layers is updated:
  useEffect(() => {
    if(! filter.gebied) return;
    if(! visible_layers || visible_layers.length === 0) return;

    // Fetch hubs
    (async () => {
      const res = await fetch_hubs({
        token: token,
        municipality: filter.gebied,
        visible_layers: visible_layers
      });
      setPolicyHubs(res);
    })();
  }, [
    filter.gebied,
    visible_layers,
    visible_layers.length
  ]);

  // Do things if 'policyHubs' change
  useEffect(() => {
    // Return
    if(! map) return;
    if(! policyHubs) return;
    
    renderHubs(map, policyHubs);

    // onComponentUnLoad
    return () => {

    };
  }, [
    policyHubs
  ]);
  // onComponentUnLoad
  useEffect(() => {
    return () => {
      removeHubsFromMap(map);
    };
  }, []);

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
