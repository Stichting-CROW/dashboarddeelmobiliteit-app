import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom'
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';

// import {
//   DISPLAYMODE_PARK,
//   DISPLAYMODE_RENTALS,
// } from '../../reducers/layers.js';

import {
  setSelectedPolicyHubs
} from '../../actions/policy-hubs'

import {
  renderHubs,
  removeHubsFromMap
} from '../Map/MapUtils/map.policy_hubs';

import {
  initMapboxDraw,
  initEventHandlers,
  updateArea,
  enableDrawingPolygon
} from '../Map/MapUtils/map.policy_hubs.draw';

import {StateType} from '../../types/StateType.js';

import { fetch_hubs } from '../../helpers/policy-hubs/fetch-hubs'
import { commit_to_concept } from '../../helpers/policy-hubs/commit-to-concept'
import PolicyHubsEdit from '../PolicyHubsEdit/PolicyHubsEdit';
import ActionModule from '../ActionModule/ActionModule';
import { ActionButtons } from '../ActionButtons/ActionButtons';
import Button from '../Button/Button';
import PolicyHubsCommit from '../PolicyHubsEdit/PolicyHubsCommit';
import { getMapStyles, setMapStyle } from '../Map/MapUtils/map';
import { DrawedAreaType } from '../../types/DrawedAreaType';

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()

  const [policyHubs, setPolicyHubs] = useState([]);
  const [drawingEnabled, setDrawingEnabled] = useState<any>();
  const [draw, setDraw] = useState<any>();
  const [drawedArea, setDrawedArea] = useState<DrawedAreaType>();

  const filter = useSelector((state: StateType) => state.filter || null);
  const mapStyle = useSelector((state: StateType) => state.layers.map_style || null);
  
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

  // On component load: Set satelite view
  const mapStyles = getMapStyles();
  useEffect(() => {
    if(! map) return;

    // Wait until map has been loaded
    map.on('load', function() {
      dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'satelite' })
      setMapStyle(map, mapStyles.satelite)
    });
  }, [
    map
  ]);

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

  // If mapStyle changes: re-render after a short delay
  useEffect(() => {
    // Return
    if(! map) return;
    if(! policyHubs) return;
    
    setTimeout(() => {
      renderHubs(map, policyHubs, selected_policy_hubs);
    }, 50);
  }, [mapStyle]);

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

  // If drawingEnabled changes: Do things
  useEffect(() => {
    if(! map) return;
    // If drawing isn't enabled: Remove draw tools
    if(! drawingEnabled) {
        // Remove all drawed zones from the map
        if(draw) draw.deleteAll();
        return;
    }
    // Initialize draw
    let Draw = draw;
    if(! draw) {
      Draw = initMapboxDraw(map)
      setDraw(Draw);
      initEventHandlers(map, changeAreaHandler);
    };
    // Enable drawing polygons
    enableDrawingPolygon(Draw);
  }, [
    map,
    drawingEnabled
  ])

  const changeAreaHandler = (e) => {
    console.log(e)
    // Set drawedArea
    setDrawedArea({
      type: e.type,
      features: e.features
    });
    // Show edit window
    dispatch(setSelectedPolicyHubs(['new']))
  }

  const clickHandler = (e) => {
    if(! map) return;
  
    // Stop if no features were found
    if(! e.features || ! e.features[0]) {
      return;
    }

    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    // Store active hub ID in redux state
    dispatch(setSelectedPolicyHubs([props.id]))
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
    if(! policyHubs || ! policyHubs[0]) return;
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

    {/* Vaststellen button */}
    {(didSelectConceptHub() && ! show_commit_form) && <ActionButtons>
      <Button theme="primary" onClick={() => commitToConcept(selected_policy_hubs ? selected_policy_hubs[0] : null)}>
        Vaststellen
      </Button>
    </ActionButtons>}

    {/* Teken hub button */}
    {(! didSelectOneHub() && ! drawingEnabled) && <ActionButtons>
      <Button theme="primary" onClick={() => setDrawingEnabled('new')}>
        Teken nieuwe hub
      </Button>
    </ActionButtons>}

    {/* Hub edit form */}
    {(didSelectOneHub() && ! show_commit_form) && <ActionModule>
      <PolicyHubsEdit
        all_policy_hubs={policyHubs}
        selected_policy_hubs={selected_policy_hubs}
        drawed_area={drawedArea}
        cancelHandler={() => {
          setDrawingEnabled(false);
        }}
      />
    </ActionModule>}

    {/* Hub 'commit to concept' form */}
    {(didSelectOneHub() && show_commit_form) && <ActionModule>
      <PolicyHubsCommit all_policy_hubs={policyHubs} selected_policy_hubs={selected_policy_hubs} />
    </ActionModule>}
  </>
}

export default DdPolicyHubsLayer;
