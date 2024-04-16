import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom'
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';

// import {
//   DISPLAYMODE_PARK,
//   DISPLAYMODE_RENTALS,
// } from '../../reducers/layers.js';

import {
  renderHubs,
  removeHubsFromMap
} from '../Map/MapUtils/map.policy_hubs';

// import {
//   initPopupLogic,
// } from '../Map/MapUtils/map.policy_hubs.popups';

import {StateType} from '../../types/StateType.js';

import { fetch_hubs } from '../../helpers/policy-hubs/fetch-hubs'
import { commit_to_concept } from '../../helpers/policy-hubs/commit-to-concept'
import PolicyHubsEdit from '../PolicyHubsEdit/PolicyHubsEdit';
import ActionModule from '../ActionModule/ActionModule';
import { ActionButtons } from '../ActionButtons/ActionButtons';
import Button from '../Button/Button';
import PolicyHubsCommit from '../PolicyHubsEdit/PolicyHubsCommit';

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()

  const [policyHubs, setPolicyHubs] = useState([]);

  const filter = useSelector((state: StateType) => state.filter || null);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const selected_policy_hubs = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.selected_policy_hubs : false;
  });

  const show_commit_form = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.show_commit_form : false;
  });

  // const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);

  // onComponentUnLoad
  useEffect(() => {
    return () => {
      removeHubsFromMap(map);
    };
  }, []);

  // If 'gebied' or 'visible_layers' is updated:
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

  // Render hubs if 'policyHubs' or 'selected_policy_hubs' change
  useEffect(() => {
    // Return
    if(! map) return;
    if(! policyHubs) return;
    
    renderHubs(map, policyHubs, selected_policy_hubs);

    // onComponentUnLoad
    return () => {

    };
  }, [
    policyHubs,
    selected_policy_hubs
  ]);

  // Init hub click handlers
  useEffect(() => {
    if(! map) return;

    const layerName = 'policy_hubs-layer-fill';

    map.on('touchend', layerName, clickHandler);
    map.on('click', layerName, clickHandler);

    return () => {
      map.off('touchend', layerName, clickHandler);
      map.off('click', layerName, clickHandler);
    }
  }, [
    map
  ]);

  const clickHandler = (e) => {
    if(! map) return;
  
    // Stop if no features were found
    if(! e.features || ! e.features[0]) {
      return;
    }

    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    // Store active hub ID in redux state
    dispatch({
      type: 'SET_SELECTED_POLICY_HUBS',
      payload: [props.id]
    })

    console.log('props', props)
  }

  const didSelectOneHub = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return false;
    }
    // Check if only 1 hub was selected
    const didSelectOneHub = selected_policy_hubs.length === 1;
    if(! didSelectOneHub) return false;

    return true;
  }

  const didSelectConceptHub = () => {
    if(! didSelectOneHub) return;

    // Get extra hub info
    const selected_hub = policyHubs.find(x => x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'concept';
  }

  const commitToConcept = (zone_id) => {
    dispatch({
      type: 'SET_SHOW_COMMIT_FORM',
      payload: true
    });
  }

  return <>
    <PolicyHubsPhaseMenu />
    {(didSelectConceptHub() && ! show_commit_form) && <ActionButtons>
      <Button theme="primary" onClick={() => commitToConcept(selected_policy_hubs ? selected_policy_hubs[0] : null)}>
        Vaststellen
      </Button>
    </ActionButtons>}
    {(didSelectConceptHub() && ! show_commit_form) && <ActionModule>
      <PolicyHubsEdit all_policy_hubs={policyHubs} selected_policy_hubs={selected_policy_hubs} />
    </ActionModule>}
    {(didSelectOneHub() && show_commit_form) && <ActionModule>
      <PolicyHubsCommit all_policy_hubs={policyHubs} selected_policy_hubs={selected_policy_hubs} />
    </ActionModule>}
  </>
}

export default DdPolicyHubsLayer;
