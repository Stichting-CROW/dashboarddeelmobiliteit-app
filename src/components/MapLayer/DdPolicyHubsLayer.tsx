import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom'
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';

import {
  setHubsInDrawingMode,
  setSelectedPolicyHubs,
  setIsDrawingEnabled,
  setVisibleLayers,
  setShowEditForm
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
import { update_url } from '../../helpers/policy-hubs/update-url';

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

  const show_edit_form = useSelector((state: StateType) => {
    return state.policy_hubs ? state.policy_hubs.show_edit_form : false;
  });

  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);

  const queryParams = new URLSearchParams(window.location.search);

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

  // Load state based on query params
  useEffect(() => {
    const gm_code = queryParams.get('gm_code');
    if(gm_code) {
      dispatch({
        type: 'SET_FILTER_GEBIED',
        payload: gm_code
      })
    }
    const visible = queryParams.getAll('visible');
    if(visible) {
      dispatch(setVisibleLayers(visible));
    }
    const selected = queryParams.getAll('selected');
    if(selected) {
      const selectedIds = selected.map(x => Number(x));
      dispatch(setSelectedPolicyHubs(selectedIds));
      dispatch(setShowEditForm(true));
    }
  }, [])

  // If selected_policy_hubs changes -> update URL
  useEffect(() => {
    update_url({
      selected: selected_policy_hubs
    });
  }, [selected_policy_hubs])

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
      filterPolicyHubs(policyHubs, visible_layers),
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

  // Function that filters hubs based on the selected phases in the Filterbar
  const filterPolicyHubs = (hubs: any, visible_layers: any) => {
    // If there was an error or no hubs were found: Return empty array
    if(! hubs || hubs.detail) {
      return [];
    }

    let hubsToKeep = [];

    visible_layers.forEach((x) => {
      // Hub
      if(x === 'hub-concept') {
        hubsToKeep.push({geo_type: 'stop', phase: 'concept'});
        hubsToKeep.push({geo_type: 'stop', phase: 'retirement_concept'});
      }
      else if(x === 'hub-committed_concept') {
        hubsToKeep.push({geo_type: 'stop', phase: 'committed_concept'});
        hubsToKeep.push({geo_type: 'stop', phase: 'retirement_committed_concept'});
      }
      else if(x === 'hub-published') {
        hubsToKeep.push({geo_type: 'stop', phase: 'published'});
        hubsToKeep.push({geo_type: 'stop', phase: 'retirement_published'});
      }
      else if(x === 'hub-active') {
        hubsToKeep.push({geo_type: 'stop', phase: 'active'});
      }
      // No parking
      else if(x === 'verbodsgebied-concept') {
        hubsToKeep.push({geo_type: 'no_parking', phase: 'concept'});
        // hubsToKeep.push({geo_type: 'no_parking', phase: 'retirement_concept'});
      }
      else if(x === 'verbodsgebied-committed_concept') {
        hubsToKeep.push({geo_type: 'no_parking', phase: 'committed_concept'});
        hubsToKeep.push({geo_type: 'no_parking', phase: 'retirement_committed_concept'});
      }
      else if(x === 'verbodsgebied-published') {
        hubsToKeep.push({geo_type: 'no_parking', phase: 'published'});
        hubsToKeep.push({geo_type: 'no_parking', phase: 'retirement_published'});
      }
      else if(x === 'verbodsgebied-active') {
        hubsToKeep.push({geo_type: 'no_parking', phase: 'active'});
      }
      // Monitoring
      else if(x === 'analyse-concept') {
        hubsToKeep.push({geo_type: 'monitoring', phase: 'concept'});
      }
    });

    const filteredHubs = hubs.filter((x) => {
      const wannaSee = hubsToKeep.find(keep => 
        keep.geo_type === x.geography_type && keep.phase === x.phase
      );
      return wannaSee;
    })

    return filteredHubs;
  }

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
        filterPolicyHubs(policyHubs, visible_layers),
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
    selected_policy_hubs,
    is_drawing_enabled
  ]);

  // If active phase changes: unselect all 

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
      dispatch(setShowEditForm(true));
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

    // Get coordinates and props
    const coordinates = e.lngLat;
    const props = e.features[0].properties;

    // Check if user holds ctrl (or Command on MacOS)
    const userHoldsCtrl = (e.originalEvent !== undefined ? (e.originalEvent.metaKey || e.originalEvent.ctrlKey) : false);

    // Define new selected hub ids
    const newHubIds = userHoldsCtrl
      // If control is down:
      ? (selected_policy_hubs.indexOf(props.id) > -1
          // Remove hub from selection if it was selected
          ? selected_policy_hubs.filter(x => x != props.id)
          // Otherwise add hub to selection
          : [...selected_policy_hubs, props.id]
      // If control key was not held down: Just set hub ID as selected hub
      ) : [props.id];

    // Store active hub ID in redux state
    dispatch(setSelectedPolicyHubs(newHubIds));
    // Show edit form if user selected 1 hub
    dispatch(setShowEditForm(newHubIds.length === 1));
  }

  const getSelectedHub = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return false;
    }
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;

    return selected_hub;
  }

  const didSelectHub = () => getSelectedHub() ? true : false;

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
    if(! didSelectHub()) return;

    // Get extra hub info
    if(! policyHubs || policyHubs.length <= 0) return;

    // Get hub info
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

  const didSelectPublishedHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'published';
  }

  const didSelectActiveHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'active';
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
      <Button theme="white" onClick={() => commitToConcept(selected_policy_hubs ? selected_policy_hubs[0] : null)}>
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
        dispatch(setShowEditForm(false));
        fetchHubs();
      }}>
        Terugzetten naar concept
      </Button>
    </ActionButtons>}

    {/* 'Nieuw concept op basis van' button */}
    {(didSelectPublishedHub() || didSelectActiveHub()) && <ActionButtons>
      <Button theme="white" onClick={async () => {
        if(! window.confirm('Wil je een wijziging aanbrengen in deze definitieve hub d.w.z. een nieuwe concepthub maken? Klik dan op OK')) {
          return;
        }
        await makeConcept(token, [getSelectedHub()?.geography_id]);
        notify('De hub is omgezet naar een nieuw concept');
        dispatch(setSelectedPolicyHubs([]));
        dispatch(setShowEditForm(false));
        fetchHubs();
      }}>
        Omzetten naar nieuw concept
      </Button>
      <Button theme="white" onClick={async () => {
        if(! window.confirm('Wil je voorstellen deze hub te verwijderen? Er komt dan een voorstel tot verwijderen in de conceptfase.')) {
          return;
        }
        notify('Deze functionaliteit is in ontwikkeling');
      }}>
        Voorstel tot verwijderen
      </Button>
    </ActionButtons>}

    {/* Teken hub button */}
    {(! didSelectHub() && ! show_edit_form && ! is_drawing_enabled && active_phase === 'concept') && <ActionButtons>
      <Button theme="white" onClick={() => dispatch(setIsDrawingEnabled('new'))}>
        Teken nieuwe hub
      </Button>
    </ActionButtons>}

    {/* Hub edit form */}
    {(didSelectOneHub() && show_edit_form && ! show_commit_form) && <ActionModule>
      <PolicyHubsEdit
        fetchHubs={fetchHubs}
        all_policy_hubs={policyHubs}
        selected_policy_hubs={selected_policy_hubs}
        drawed_area={drawedArea}
        cancelHandler={() => {
          dispatch(setHubsInDrawingMode([]));
          dispatch(setIsDrawingEnabled(false));
          dispatch(setShowEditForm(false));
          setDrawedArea(undefined);
        }}
      />
    </ActionModule>}

    {/* Hub 'commit to concept' form */}
    {(didSelectHub() && show_commit_form) && <ActionModule>
      <PolicyHubsCommit
        all_policy_hubs={policyHubs}
        selected_policy_hubs={selected_policy_hubs}
        fetchHubs={fetchHubs}
      />
    </ActionModule>}
  </>
}

export default DdPolicyHubsLayer;
