import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom'
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';

import {
  setHubsInDrawingMode,
  setSelectedPolicyHubs,
  setIsDrawingEnabled
} from '../../actions/policy-hubs'

import {
  renderHubs,
  removeHubsFromMap
} from '../Map/MapUtils/map.policy_hubs';

import {
  initMapboxDraw,
  initEventHandlers,
  enableDrawingPolygon,
  selectDrawPolygon,
  removeDrawedPolygons
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
import { makeConcept } from '../../helpers/policy-hubs/make-concept';
import { notify } from '../../helpers/notify';

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()

  const [policyHubs, setPolicyHubs] = useState([]);
  const [draw, setDraw] = useState<any>();
  const [drawedArea, setDrawedArea] = useState<DrawedAreaType | undefined>();

  const filter = useSelector((state: StateType) => state.filter || null);
  const mapStyle = useSelector((state: StateType) => state.layers.map_style || null);
  
  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');

  const selected_policy_hubs = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.selected_policy_hubs : [];
  });

  const hubs_in_drawing_mode = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.hubs_in_drawing_mode : [];
  });

  const is_drawing_enabled = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.is_drawing_enabled : [];
  });
  
  const show_commit_form = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.show_commit_form : false;
  });

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

    fetchHubs()
  }, [
    filter.gebied,
    visible_layers,
    visible_layers.length
  ]);

  // Render hubs if 'policyHubs' or 'selected_policy_hubs' or 'hubs_in_drawing_mode' change
  useEffect(() => {
    // Return
    if(! map) return;
    if(! policyHubs) return;

    renderHubs(
      map,
      policyHubs,
      selected_policy_hubs,
      hubs_in_drawing_mode
    );

    // onComponentUnLoad
    return () => {
    };
  }, [
    policyHubs,
    selected_policy_hubs,
    hubs_in_drawing_mode
  ]);

  useEffect(() => {
    if(hubs_in_drawing_mode && hubs_in_drawing_mode.length > 0) {
      drawEditablePolygon();
    }
    else {
      removeDrawedPolygons(draw);
    }
  }, [
    draw,
    is_drawing_enabled,
    hubs_in_drawing_mode
  ]);

  // Fetch hubs
  const fetchHubs = async () => {
    const res = await fetch_hubs({
      token: token,
      municipality: filter.gebied,
      visible_layers: visible_layers
    });
    setPolicyHubs(res);

    return res;
  };

  const drawEditablePolygon = () => {
    if(! map) return;
    if(! draw) return;
    if(! hubs_in_drawing_mode || ! hubs_in_drawing_mode[0]) return;

    const selected_hub = policyHubs.find(x => x.zone_id === hubs_in_drawing_mode[0]);
    if(! selected_hub || ! selected_hub.area) return;

    // Add editable feature to the map
    draw.add({
      ...selected_hub.area,
      id: hubs_in_drawing_mode[0]
    });
    // Select the polygon, so it is editable
    setTimeout(() => {
      selectDrawPolygon(draw, hubs_in_drawing_mode[0]);
    }, 25);
  }

  // If mapStyle changes: re-render after a short delay
  useEffect(() => {
    // Return
    if(! map) return;
    if(! policyHubs) return;
    
    setTimeout(() => {
      renderHubs(
        map,
        policyHubs,
        selected_policy_hubs,
        hubs_in_drawing_mode
      );
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
    map,
    is_drawing_enabled
  ]);

  // If is_drawing_enabled changes: Do things
  useEffect(() => {
    if(! map) return;
    // If drawing isn't enabled: Remove draw tools
    if(! is_drawing_enabled) {
        removeDrawedPolygons(draw);
        return;
    }
    // Initialize draw
    let Draw = draw;
    if(! draw) {
      Draw = initMapboxDraw(map)
      setDraw(Draw);
      initEventHandlers(map, changeAreaHandler);
    };
    if(is_drawing_enabled === 'new') {
      // Show edit window
      dispatch(setSelectedPolicyHubs(['new']))
      // Enable drawing polygons
      setTimeout(() => {
        enableDrawingPolygon(Draw);
      }, 25);
    }
    else if(is_drawing_enabled) {
      setTimeout(() => {
        selectDrawPolygon(Draw, is_drawing_enabled);
      }, 25);
    }
  }, [
    map,
    is_drawing_enabled
  ])

  const changeAreaHandler = (e) => {
    // Set drawedArea
    setDrawedArea({
      type: e.type,
      features: e.features
    });
    // console.log('changeAreaHandler', e)
  }

  const clickHandler = (e) => {
    if(! map) return;
    
    // Don't do anything if the drawing tool is enabled
    if(is_drawing_enabled) return;
  
    // Stop if no features were found
    if(! e.features || ! e.features[0]) {
      return;
    }

    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    // Store active hub ID in redux state
    dispatch(setSelectedPolicyHubs([props.id]))
  }

  const getSelectedHub = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return false;
    }
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;

    return selected_hub;
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
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'concept';
  }

  const didSelectCommittedConceptHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'committed_concept';
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
    {(didSelectConceptHub() && getSelectedHub()?.geography_type !== 'monitoring' && ! show_commit_form) && <ActionButtons>
      <Button theme="primary" onClick={() => commitToConcept(selected_policy_hubs ? selected_policy_hubs[0] : null)}>
        Vaststellen
      </Button>
    </ActionButtons>}

    {/* Terug naar concept button */}
    {(didSelectCommittedConceptHub() && ! show_commit_form) && <ActionButtons>
      <Button theme="red" onClick={async () => {
        await makeConcept(token, [getSelectedHub()?.geography_id]);
        if(! window.confirm('Wil je de vastgestelde hub terugzetten naar de conceptfase?')) {
          return;
        }
        notify('De hub is teruggezet naar de conceptfase');
        dispatch(setSelectedPolicyHubs([]));
        fetchHubs();
      }}>
        Terugzetten naar concept
      </Button>
    </ActionButtons>}

    {/* Teken hub button */}
    {(! didSelectOneHub() && ! is_drawing_enabled && active_phase === 'concept') && <ActionButtons>
      <Button theme="primary" onClick={() => dispatch(setIsDrawingEnabled('new'))}>
        Teken nieuwe hub
      </Button>
    </ActionButtons>}

    {/* Hub edit form */}
    {(didSelectOneHub() && ! show_commit_form) && <ActionModule>
      <PolicyHubsEdit
        fetchHubs={fetchHubs}
        all_policy_hubs={policyHubs}
        selected_policy_hubs={selected_policy_hubs}
        drawed_area={drawedArea}
        cancelHandler={() => {
          dispatch(setHubsInDrawingMode([]));
          dispatch(setIsDrawingEnabled(false));
          setDrawedArea(undefined);
        }}
      />
    </ActionModule>}

    {/* Hub 'commit to concept' form */}
    {(didSelectOneHub() && show_commit_form) && <ActionModule>
      <PolicyHubsCommit
        all_policy_hubs={policyHubs}
        selected_policy_hubs={selected_policy_hubs}
        fetchHubs={fetchHubs}
      />
    </ActionModule>}
  </>
}

export default DdPolicyHubsLayer;
