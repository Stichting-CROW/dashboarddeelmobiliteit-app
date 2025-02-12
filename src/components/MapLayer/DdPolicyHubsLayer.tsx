import { useToast } from "../ui/use-toast"
import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom'
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';
import st from 'geojson-bounds';

import {generatePopupHtml} from '../Map/MapUtils/zones.js';

import {
  setHubsInDrawingMode,
  setSelectedPolicyHubs,
  setIsDrawingEnabled,
  setVisibleLayers,
  setShowEditForm,
  setShowList,
  setHubRefetchCounter
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
import PolicyHubsEdit from '../PolicyHubsEdit/PolicyHubsEdit';
import PolicyHubsStats from '../PolicyHubsStats/PolicyHubsStats';
import ActionModule from '../ActionModule/ActionModule';
import { ActionButtons } from '../ActionButtons/ActionButtons';
import Button from '../Button/Button';
import PolicyHubsCommit from '../PolicyHubsEdit/PolicyHubsCommit';
import { getMapStyles, applyMapStyle, setBackgroundLayer } from '../Map/MapUtils/map';
import { DrawedAreaType } from '../../types/DrawedAreaType';
import { makeConcept } from '../../helpers/policy-hubs/make-concept';
import { notify } from '../../helpers/notify';
import { update_url } from '../../helpers/policy-hubs/update-url';
import { setActivePhase } from '../../actions/policy-hubs';
import { getGeoIdForZoneIds, sortZonesInPreferedOrder } from '../../helpers/policy-hubs/common';
import { canEditHubs } from '../../helpers/authentication';
import { proposeRetirement } from '../../helpers/policy-hubs/propose-retirement';
import { setMapStyle } from '../../actions/layers';
import { cn } from "../../lib/utils";
import moment from "moment";
import maplibregl from "maplibre-gl";

let TO_fetch_delay;

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()
  const { toast } = useToast()
  
  const [policyHubs, setPolicyHubs] = useState([]);
  const [draw, setDraw] = useState<any>();
  const [drawedArea, setDrawedArea] = useState<DrawedAreaType | undefined>();
  const [drawnFeatures, setDrawnFeatures] = useState<any[]>([]);

  const filter = useSelector((state: StateType) => state.filter || null);
  const mapStyle = useSelector((state: StateType) => state.layers.map_style || null);

  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);
  
  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const hub_refetch_counter = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.hub_refetch_counter : 0);
  const is_stats_or_manage_mode = useSelector((state: StateType) => state.policy_hubs.is_stats_or_manage_mode || 'stats');

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

  const uniqueComponentId = Math.random()*9000000;

  // On component load: reset 'selected_policy_hubs'
  useEffect(() => {
    dispatch(setShowEditForm(false));
    dispatch(setSelectedPolicyHubs([]));
    dispatch(setIsDrawingEnabled(false));
    dispatch(setShowList(false));

    return () => {
      clearTimeout(TO_fetch_delay);
    }
  }, []);

  useEffect(() => {
    if(! map) return;

    // Event handler for flying to a hub
    initFlyToEventHandler();

    return () => {
      destroyFlyToEventHandler();
    }
  }, [map]);

  const flyToHub = async (e) => {
    if(! map) return;

    const area = e.detail?.area;
    const zone_id = e.detail?.zone_id;

    if(! area) return;
    if(! zone_id) return;

    // Make sure hub list is hidden
    dispatch(setShowList(false));

    // Set selected hub
    // dispatch(setSelectedPolicyHubs([zone_id]));

    // Get hub extent
    const extent = st.extent(area);

    // Fly to hub
    map.fitBounds(extent);
  }
  
  const initFlyToEventHandler = () => {
    // @ts-ignore
    window.addEventListener('flyToHubTrigger', flyToHub)
    return () => {
      // @ts-ignore
      window.removeEventListener('flyToHubTrigger', flyToHub);
    }
  }

  const destroyFlyToEventHandler = () => {

  }

  // On component load: Set background layer to 'satellite layer'
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    setBackgroundLayer(map, 'luchtfoto-pdok', setMapStyle);
  }, [
    map,
    map?.U,
    document.location.pathname
  ]);

  // onComponentUnLoad
  useEffect(() => {
    return () => {
      setTimeout(() => {
        removeHubsFromMap(map);
      }, 250)//TODO: Map is unloaded lots of times
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
    if(selected && selected.length > 0) {
      const selectedIds = selected.map(x => Number(x));
      setTimeout(() => {
        dispatch(setSelectedPolicyHubs(selectedIds));
      }, 1000);
      dispatch(setShowEditForm(true));
    }
    const phase = queryParams.get('phase');
    if(phase) {
      dispatch(setActivePhase(phase));
    }
  }, [])

  // Set default state
  useEffect(() => {
    if(! active_phase) {
      dispatch(setActivePhase(acl ? 'concept' : 'active'))
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
    visible_layers.length,
    hub_refetch_counter,
  ]);

  // Render hubs if 'policyHubs' or 'selected_policy_hubs' or 'hubs_in_drawing_mode' change
  useEffect(() => {
    // Return
    if(! map) return;
    if(! map.isStyleLoaded()) return;
    if(! policyHubs) return;

    renderHubs(
      map,
      sortedPolicyHubs(filterPolicyHubs(policyHubs, active_phase, visible_layers)),
      selected_policy_hubs,
      hubs_in_drawing_mode
    );
  }, [
    policyHubs,
    policyHubs?.length,
    selected_policy_hubs,
    selected_policy_hubs?.length,
    hubs_in_drawing_mode,
    active_phase,
    mapStyle,
    map?.isStyleLoaded()
  ]);
  // TODO: Render hubs less often^

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

  // If phase changes: Check if drawing should be disabled
  useEffect(() => {
    if(active_phase !== 'concept') {
      dispatch(setIsDrawingEnabled(false));
      dispatch(setShowEditForm(false));
      setDrawedArea(undefined);
      
      // Clear selected hubs on phase change
      const selected = queryParams.getAll('selected');
      if(! (selected && selected.length > 0)) {
        dispatch(setSelectedPolicyHubs([]));
      }
    }
  }, [active_phase]);
  
  const sortedPolicyHubs = (hubs: any) => {
    // Layer/sort zones per geography_type (monitoring/stop/no_parking)
    return sortZonesInPreferedOrder(hubs)
  }

  const isHubInPhase = (hub: any, phase: string) => {
    // CONCEPT
    if(phase === 'concept') {
      // Is it a hub, and do we want to show hubs?
      if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-concept') > -1) {
        return (hub.phase === 'concept')
          || (hub.phase === 'retirement_concept')
          // TODO: In concept phase, hide retirement_concept phase if there's a follow up committed concept
      }
      else if(hub.geography_type === 'monitoring' && visible_layers.indexOf('monitoring-concept') > -1) {
        return (hub.phase === 'concept')
      }
      else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-concept') > -1) {
        return (hub.phase === 'concept')
          || (hub.phase === 'retirement_concept')
      }
    }

    // COMMITTED CONCEPT
    else if(phase === 'committed_concept') {
      if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-committed_concept') > -1) {
        return (hub.phase === 'committed_concept')
          || (hub.phase === 'committed_retirement_concept')
        ;
      } else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-committed_concept') > -1) {
        return (hub.phase === 'committed_concept')
          || (hub.phase === 'committed_retirement_concept')
        ;
      }
    }

    // PUBLISHED
    else if(phase === 'published') {
      if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-published') > -1) {
        return (hub.phase === 'published')
          || (hub.phase === 'published_retirement')
          // In published phase: only show retirement concept with effective date >= now()
          || (hub.phase === 'retirement_concept' && moment(moment()).isBefore(hub.effective_date))
          ;
      } else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-published') > -1) {
        return (hub.phase === 'published')
          || (hub.phase === 'published_retirement')
          // In published phase: only show retirement concept with effective date >= now()
          // || (hub.phase === 'X' && moment(moment()).isBefore(hub.effective_date))
          ;
      }
    }

    // ACTIVE
    else if(phase === 'active') {
      // Is it a hub, and do we want to show hubs?
      if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-active') > -1) {
        return (hub.phase === 'active')
          // Show retirement concept if hub is not yet retired
          // As long as retirement concepts are not active, these should be still visible in published/active
          || (hub.phase === 'retirement_concept' && moment(hub.effective_date).isBefore(moment()))
          // Show active retirement if hub is retired
          || (hub.phase === 'active_retirement')
          // In active phase: only show retirement concept with effective date < now()
          || (hub.phase === 'committed_retirement_concept' && moment(moment()).isBefore(hub.retire_date))
          || (hub.phase === 'published_retirement' && moment(moment()).isBefore(hub.retire_date))
          ;
      } else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-active') > -1) {
        return (hub.phase === 'active')
          || (hub.phase === 'active_retirement')
          // In active phase: only show retirement concept with effective date < now()
          || (hub.phase === 'committed_retirement_concept' && moment(moment()).isBefore(hub.retire_date))
          || (hub.phase === 'published_retirement' && moment(moment()).isBefore(hub.retire_date))
          ;
      }
      if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-archived') > -1) {
        return (hub.phase === 'archived');
      }
      else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-archived') > -1) {
        return (hub.phase === 'archived');
      }
    }

    // ARCHIVED
    else if(phase === 'archived') {
      if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-archived') > -1) {
        return (hub.phase === 'archived');
      }
      else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-archived') > -1) {
        return (hub.phase === 'archived');
      }
    }

    return false;
  }

  // Check if hub is in visible layers
  const isHubInVisibleLayers = (hub: any) => {
    let isInVisibleLayers = false;

    // Get all visible phases based on visible layers
    const visiblePhases = visible_layers.map((layer) => {
      return layer.split('-')[1];// Get last part of layer name (e.g. 'hub-active' -> 'active')
    });

    visiblePhases.forEach((phase) => {
      if(isHubInPhase(hub, phase)) {
        isInVisibleLayers = true;
      }
    });

    return isInVisibleLayers;
  }

  // Function that filters hubs based on the selected phases in the Filterbar
  const filterPolicyHubs = (hubs: any, active_phase: string, visible_layers: any) => {
    // If there was an error or no hubs were found: Return empty array
    if(! hubs) {
      return [];
    }

    // Only keep hubs that we want to see
    let filteredHubs = hubs.filter((x) => {
      const isInPhase = isHubInPhase(x, active_phase);
      const isInVisibleLayers = isHubInVisibleLayers(x);

      return isInPhase || isInVisibleLayers;
    });

    // Remove all zones that have a zone ID of any of the prev_geography_ids
    const uniqueHubs = filteredHubs.filter(hub => {
      // Check if any other hub has this hub's zone_id in its prev_geography_ids
      const isReplacedByNewer = filteredHubs.some(otherHub => 
        otherHub.prev_geographies && 
        otherHub.prev_geographies.includes(hub.geography_id)
      );
      return ! isReplacedByNewer;
    });
    
    return uniqueHubs;
  }

  // Fetch hubs
  const fetchHubs = async () => {
    // Add a small delay to prevent multiple fetches
    if(TO_fetch_delay) clearTimeout(TO_fetch_delay);
    TO_fetch_delay = setTimeout(async () => {
      try {
        const res: any = await fetch_hubs({
          token: token,
          municipality: filter.gebied,
          phase: active_phase,
          visible_layers: visible_layers
        }, uniqueComponentId);
        setPolicyHubs(res);
      }
      catch(err) {
        console.error(err);
      }
    }, 50);
    return true;
  };

  const drawEditablePolygon = () => {
    if(! map) return;
    if(! draw) return;
    if(! hubs_in_drawing_mode || ! hubs_in_drawing_mode[0]) return;

    if(! policyHubs || policyHubs.length <= 0) return;

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

  // If is_drawing_enabled changes: Do things
  useEffect(() => {
    if(! map) return;
    // If drawing isn't enabled: Remove draw tools
    if(! is_drawing_enabled) {
        removeDrawedPolygons(draw);
        setDrawnFeatures([]);
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
    const userHoldsCtrl = (e.originalEvent !== undefined ? (e.originalEvent.metaKey || e.originalEvent.ctrlKey || e.originalEvent.shiftKey) : false);

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

    // Show edit form if user selected >= 1 hubs (hidden if stats mode)
    dispatch(setShowEditForm(true));
  }

  const getSelectedHub = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return false;
    }
    
    if(! policyHubs || policyHubs.length <= 0) return;

    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;

    return selected_hub;
  }

  const getSelectedHubs = () => {
    if(! selected_policy_hubs || selected_policy_hubs.length <= 0) {
      return [];
    }
    
    if(! policyHubs || policyHubs.length <= 0) return [];

    return policyHubs.filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1);
  }

  const didSelectHub = () => {
    // If we did draw a new polygon, return true
    if(selected_policy_hubs && selected_policy_hubs[0] === 'new') return true;
    // Otherwise: Check if a hub is selected
    return getSelectedHub() ? true : false;
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

  const didSelectHubHub = () => {
    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if zone is a hub
    return selected_hub.geography_type === 'stop';
  }

  const didSelectConceptHub = () => {
    if(! didSelectHub()) return;

    // Get extra hub info
    if(! policyHubs || policyHubs.length <= 0) return;

    // Hub phases we want to keep
    const wantedHubPhases = [
      'concept',
    ];
    // If we are not in ACTIVE phase, we also want to keep retirement_concepts
    if(active_phase !== 'active') {
      wantedHubPhases.push('retirement_concept');
    }

    // Every selected hub should be a concept hub
    const unwantedHubs = policyHubs.filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1).filter((x) => {
      return wantedHubPhases.indexOf(x.phase) <= -1;
    })

    const didSelectUnwantedHubs = unwantedHubs?.length > 0;

    return unwantedHubs?.length === 0;
  }

  const didSelectCommittedConceptHub = () => {
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

  const didSelectCommittedRetirementHub = () => {
    if(! didSelectOneHub()) return;

    // Get extra hub info
    if(! policyHubs || ! policyHubs[0]) return;
    const selected_hub = policyHubs.find(x => selected_policy_hubs && x.zone_id === selected_policy_hubs[0]);
    if(! selected_hub) return false;
    
    // Return if hub is a concept hub
    return selected_hub.phase === 'committed_retirement_concept';
  }

  const didSelectAnyMonitoringHubs = () => {
    if(! didSelectHub()) return;
    if(! policyHubs || policyHubs.length <= 0) return;

    // Hub geotypes we want to keep
    const wantedGeoTypes = [
      'monitoring'
    ];

    // At least one hub should be a monitoring hub
    const monitoringHubs = policyHubs.filter(x => selected_policy_hubs.indexOf(x.zone_id) > -1).filter((x) => {
      return wantedGeoTypes.indexOf(x.geography_type) > -1;
    })

    return monitoringHubs?.length > 0;
  }

  const commitToConcept = (zone_id) => {
    dispatch({
      type: 'SET_SHOW_COMMIT_FORM',
      payload: true
    });
  }

  // Add handler for the "Voeg stukje multipolygon toe" button
  const handleAddPolygon = () => {
    if (!draw) return;
    
    // Store existing features
    const existingFeatures = draw.getAll().features;
    if (existingFeatures.length === 0) {
      notify(toast, 'Teken eerst een polygon voordat je een nieuwe toevoegt', {
        variant: 'destructive'
      });
      return;
    }

    // Enable drawing mode for new polygon
    enableDrawingPolygon(draw);
  };

  return <>
    <PolicyHubsPhaseMenu />

    {(canEditHubs(acl) && is_stats_or_manage_mode === 'manage') && <ActionButtons>
      {/* Teken hub button */}
      {(! is_drawing_enabled && active_phase === 'concept') && 
        <Button theme="white" onClick={() => {
          dispatch(setIsDrawingEnabled('new'))
          dispatch(setSelectedPolicyHubs([]))
        }}>
          Teken nieuwe zone
        </Button>
      }

      {false && (is_drawing_enabled === 'new' || drawnFeatures.length > 0) && (
        <Button 
          theme="white" 
          onClick={handleAddPolygon}
        >
          Voeg stukje multipolygon toe
        </Button>
      )}

      {/* Vaststellen button */}
      {(didSelectConceptHub()
        && ! didSelectAnyMonitoringHubs()
        && ! show_commit_form
      ) && 
        <Button theme="white" onClick={() => commitToConcept(selected_policy_hubs ? selected_policy_hubs[0] : null)}>
          Vaststellen
        </Button>
      }

      {/* Terug naar concept button */}
      {((didSelectCommittedConceptHub() || didSelectCommittedRetirementHub()) && ! show_commit_form) && 
        <Button theme="red" onClick={async () => {
          await makeConcept(token, getSelectedHubs().map(x => x.geography_id));
          if(! window.confirm('Wil je de vastgestelde hub(s) terugzetten naar de conceptfase?')) {
            return;
          }

          notify(toast, 'De hub(s) is/zijn teruggezet naar de conceptfase');

          dispatch(setSelectedPolicyHubs([]));
          dispatch(setShowEditForm(false));
          fetchHubs();
        }}>
          Terugzetten naar concept
        </Button>
      }

      {/* 'Nieuw concept op basis van' button */}
      {(didSelectPublishedHub() || didSelectActiveHub()) && <>
        <Button theme="white" onClick={async () => {
          if(! window.confirm('Wil je een wijziging aanbrengen in deze definitieve hub d.w.z. een nieuwe concepthub maken? Klik dan op OK')) {
            return;
          }
          await makeConcept(token, [getSelectedHub()?.geography_id]);
          notify(toast, 'De hub is omgezet naar een nieuw concept');
          dispatch(setSelectedPolicyHubs([]));
          dispatch(setShowEditForm(false));
          fetchHubs();
        }}>
          Omzetten naar nieuw concept
        </Button>
      </>}

      {(didSelectPublishedHub() || didSelectActiveHub()) && <>
        <Button theme="white" onClick={async () => {
          if(! window.confirm('Wil je voorstellen deze hub te verwijderen? Er komt dan een voorstel tot verwijderen in de conceptfase.')) {
            return;
          }
          try {
            const selectedGeoIds = getGeoIdForZoneIds(policyHubs, selected_policy_hubs);
            const response = await proposeRetirement(token, selectedGeoIds);
    
            if(response && response.detail) {
                // Give error if something went wrong
                notify(
                  toast,
                  'Er ging iets fout bij het voorstellen tot verwijderen',
                  {
                    title: 'Er ging iets fout',
                    variant: 'destructive'
                  }
                );
            }
            else {
              notify(toast, 'Het verwijdervoorstel is toegevoegd, zie de conceptfase');
              dispatch(setShowEditForm(false));
              dispatch(setHubRefetchCounter(hub_refetch_counter+1))
            }
          } catch(err) {
              console.error('Delete error', err);
          }
        }}>
          Voorstel tot verwijderen
        </Button>
      </>}
    </ActionButtons>}

    {/* Hub edit form */}
    {is_stats_or_manage_mode === 'manage' && <>
      {(didSelectHub() && show_edit_form && ! show_commit_form) && <ActionModule>
        <PolicyHubsEdit
          fetchHubs={fetchHubs}
          all_policy_hubs={policyHubs}
          selected_policy_hubs={selected_policy_hubs}
          drawed_area={drawedArea}
          active_phase={active_phase}
          cancelHandler={() => {
            dispatch(setIsDrawingEnabled(false));
            dispatch(setHubsInDrawingMode([]));
            dispatch(setShowEditForm(false));
            dispatch(setSelectedPolicyHubs([]));
            setDrawedArea(undefined);
          }}
        />
      </ActionModule>}

      {/* Hub 'commit to concept' form */}
      {(canEditHubs(acl) && didSelectHub() && show_commit_form) && <ActionModule>
        <PolicyHubsCommit
          all_policy_hubs={policyHubs}
          selected_policy_hubs={selected_policy_hubs}
          fetchHubs={fetchHubs}
        />
      </ActionModule>}
    </>}

    {(is_stats_or_manage_mode === 'stats' && didSelectOneHub() && didSelectHubHub()) && <>
      <ActionModule>
        <PolicyHubsStats
          fetchHubs={fetchHubs}
          all_policy_hubs={policyHubs}
          selected_policy_hubs={selected_policy_hubs}
          cancelHandler={() => {
            dispatch(setIsDrawingEnabled(false));
            dispatch(setHubsInDrawingMode([]));
            dispatch(setShowEditForm(false));
            dispatch(setSelectedPolicyHubs([]));
            setDrawedArea(undefined);
          }}
        />
      </ActionModule>
    </>}
  </>
}

export default DdPolicyHubsLayer;
