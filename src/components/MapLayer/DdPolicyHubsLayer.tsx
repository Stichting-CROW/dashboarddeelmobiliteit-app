import { toast, useToast } from "../ui/use-toast"
import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PolicyHubsPhaseMenu from '../PolicyHubsPhaseMenu/PolicyHubsPhaseMenu';
import st from 'geojson-bounds';
import { deDuplicateHubs, isHubInPhase } from '../../helpers/policy-hubs/common';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { notify } from '../../helpers/notify';

import {
  setHubsInDrawingMode,
  setSelectedPolicyHubs,
  setIsDrawingEnabled,
  setVisibleLayers,
  setShowEditForm,
  setShowList,
} from '../../actions/policy-hubs'

import { getGeoIdForZoneIds, sortZonesInPreferedOrder } from '../../helpers/policy-hubs/common';

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
import PolicyHubsCommit from '../PolicyHubsEdit/PolicyHubsCommit';
import { setBackgroundLayer } from '../Map/MapUtils/map';
import { DrawedAreaType } from '../../types/DrawedAreaType';
import { update_url } from '../../helpers/policy-hubs/update-url';
import { setActivePhase } from '../../actions/policy-hubs';
import { canEditHubs } from '../../helpers/authentication';
import { setMapStyle } from '../../actions/layers';
import PolicyHubsActionBar from "../PolicyHubsActionBar/PolicyHubsActionBar";
import { ContextMenu } from "./ContextMenu";
import { patchHub } from "../../helpers/policy-hubs/patch-hub";

let TO_fetch_delay;

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()
  
  const [policyHubs, setPolicyHubs] = useState([]);
  const [draw, setDraw] = useState<any>();
  const [drawedArea, setDrawedArea] = useState<DrawedAreaType | undefined>();
  const [isDrawingMultiPolygonActive, setIsDrawingMultiPolygonActive] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    hubId?: number;
    onDeletePolygonFromMultiPolygon?: () => void;
  }>({
    x: 0,
    y: 0,
    visible: false,
    hubId: undefined,
    onDeletePolygonFromMultiPolygon: undefined
  });
  const [affectedModalities, setAffectedModalities] = useState<string[]>([]);

  const filter = useSelector((state: StateType) => state.filter || null);
  const mapStyle = useSelector((state: StateType) => state.layers.map_style || null);

  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);
  
  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types ? state.metadata.vehicle_types || [] : []);

  const filterVoertuigTypesExclude = useSelector((state: StateType) => {
    if(Array.isArray(state.filter.voertuigtypesexclude)) {
      return '';
    }
    return state.filter ? state.filter.voertuigtypesexclude : '';
  }) || '';  

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

    // Init event handler for flying to a hub
    initFlyToEventHandler();

    return () => {
      destroyFlyToEventHandler();
    }
  }, [map]);

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

  // onComponentUnLoad
  useEffect(() => {
    return () => {
      setTimeout(() => {
        removeHubsFromMap(map);
      }, 250)//TODO: Map is unloaded lots of times
    };
  }, []);

  // Function that flys to a hub based on parameter given
  const flyToHub = async (e) => {
    if(! map) return;

    const area = e.detail?.area;
    const zone_id = e.detail?.zone_id;

    if(! area) return;
    if(! zone_id) return;

    // Make sure hub list is hidden
    dispatch(setShowList(false));

    // Get hub extent
    const extent = st.extent(area);

    // Fly to hub
    map.fitBounds(extent);
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
      }, 1500);
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

  // Set affectedModalities in state
  useEffect(() => {
    const filtered = voertuigtypes.filter(x => (
      ! filterVoertuigTypesExclude?.split(',').includes(x.id)
    )).map(x => x.id);

    setAffectedModalities(filtered);
  }, [
    voertuigtypes,
    filterVoertuigTypesExclude,
    filterVoertuigTypesExclude.length
  ])

  // (Re-)fetch hubs if state updates
  useEffect(() => {
    if(! filter.gebied) return;
    if(! visible_layers || visible_layers.length === 0) return;

    fetchHubs()
  }, [
    filter.gebied,
    affectedModalities,
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

  // Check if hub is in visible layers
  const isHubInVisibleLayers = (hub: any) => {
    let isInVisibleLayers = false;

    // Get all visible phases based on visible layers
    const visiblePhases = visible_layers.map((layer) => {
      return layer.split('-')[1];// Get last part of layer name (e.g. 'hub-active' -> 'active')
    });

    visiblePhases.forEach((phase) => {
      if(isHubInPhase(hub, phase, visible_layers)) {
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
      const isInPhase = isHubInPhase(x, active_phase, visible_layers);
      const isInVisibleLayers = isHubInVisibleLayers(x);

      return isInPhase || isInVisibleLayers;
    });

    // Remove all zones that have a zone ID of any of the prev_geography_ids
    const uniqueHubs = deDuplicateHubs(filteredHubs);
    
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
          visible_layers: visible_layers,
          affected_modalities: affectedModalities
        }, uniqueComponentId);
        setPolicyHubs(res);
      }
      catch(err) {
        console.error(err);
      }
    }, 50);
    return true;
  };

  // Draw editable polygon
  const drawEditablePolygon = () => {
    if(! map) return;
    if(! draw) return;
    if(! hubs_in_drawing_mode || ! hubs_in_drawing_mode[0]) return;

    if(! policyHubs || policyHubs.length <= 0) return;

    // Get selected hub
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
    const drawLayerNames = [
      'gl-draw-polygon-fill-active.cold',
      'gl-draw-polygon-fill-active.hot',
      'gl-draw-polygon-fill-inactive.cold',
      'gl-draw-polygon-fill-inactive.hot',
      'gl-draw-polygon-fill-static.cold',
      'gl-draw-polygon-fill-static.hot',
      'gl-draw-polygon-midpoint.cold',
      'gl-draw-polygon-midpoint.hot',
      'gl-draw-polygon-stroke-active.cold',
      'gl-draw-polygon-stroke-active.hot',
      'gl-draw-polygon-stroke-inactive.cold',
      'gl-draw-polygon-stroke-inactive.hot',
      'gl-draw-polygon-stroke-static.cold',
      'gl-draw-polygon-stroke-static.hot',
    ];

    // Add handlers for policy hubs layer
    map.on('touchend', layerName, clickHandler);
    map.on('click', layerName, clickHandler);
    map.on('contextmenu', layerName, clickHandler); // Prevent default context menu

    // Add handlers for draw layer
    drawLayerNames.forEach(drawLayerName => {
      map.on('contextmenu', drawLayerName, clickHandler);
    });

    // Close context menu when clicking outside
    const handleOutsideClick = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleOutsideClick);

    return () => {
      map.off('touchend', layerName, clickHandler);
      map.off('click', layerName, clickHandler);
      map.off('contextmenu', layerName, clickHandler);
        
      // Remove handlers for draw layer
      drawLayerNames.forEach(drawLayerName => {
        map.off('contextmenu', drawLayerName, clickHandler);
      });        
      window.removeEventListener('click', handleOutsideClick);
    }
  }, [
    map,
    selected_policy_hubs,
    is_drawing_enabled,
    draw
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
    };

    // If drawing is enabled and it's the first polygon
    if(is_drawing_enabled === 'new' && ! isDrawingMultiPolygonActive) {
      // Show edit window
      dispatch(setSelectedPolicyHubs(['new']))
      dispatch(setShowEditForm(true));

      // Enable drawing polygons
      setTimeout(() => {
        enableDrawingPolygon(Draw);
      }, 25);
      // Select the polygon after it's created
      if(drawedArea && drawedArea.features && drawedArea.features[0]) {
        setTimeout(() => {
          selectDrawPolygon(Draw, drawedArea.features[0].id);
        }, 25);
      }
    }

    // Auto select polygon if not in multi polygon adding mode
    else if(is_drawing_enabled && ! isDrawingMultiPolygonActive) {
      setTimeout(() => {
        selectDrawPolygon(Draw, is_drawing_enabled);
      }, 25);
    }

  }, [
    map,
    is_drawing_enabled,
    isDrawingMultiPolygonActive,
    drawedArea
  ]);

  // Init event handlers for drawing
  useEffect(() => {
    if(! map) return;
    if(! draw) return;

    // Add new event handlers
    initEventHandlers(map, changeAreaHandler);

    // Cleanup function to remove event handlers when component unmounts or effect re-runs
    return () => {
      if (map) {
        // Remove event handlers initiated in initEventHandlers
        map.off('draw.create', changeAreaHandler);
        map.off('draw.update', changeAreaHandler);
        map.off('draw.delete', changeAreaHandler);
      }
    };
  }, [
    map,
    draw,
    isDrawingMultiPolygonActive
  ]);

  // Function that runs when the drawing of a polygon is finished
  const changeAreaHandler = (e) => {
    let newFeatures = [];

    // If adding/updating normal polygon
    if(! isDrawingMultiPolygonActive) {
      newFeatures = e.features
    }

    // If adding polygon to multipolygon
    else {
      //   Example of correct coordinates for a multi polygon:

      //   [
      //     [
      //         [  // First Polygon (Outer Ring)
      //             [5.114602206, 52.096831096],
      //             [5.114754998, 52.096584701],
      //             [5.115125518, 52.096662139],
      //             [5.115136977, 52.096894454],
      //             [5.114602206, 52.096831096]
      //         ]
      //     ],
      //     [
      //         [  // Second Polygon (Outer Ring)
      //             [5.114663322501997, 52.096868641360516],
      //             [5.114999464582581, 52.09691322689255],
      //             [5.1150262031570435, 52.09706106281101],
      //             [5.114640403724138, 52.09702586382747],
      //             [5.114663322501997, 52.096868641360516]
      //         ]
      //     ]
      // ]
      //     [
      
      let drawedCoordinates = [];
      if(isDrawingMultiPolygonActive) {
        // Get the coordinates of the polygon that was just drawn
        const newPolygonCoordinates = e.features[0].geometry.coordinates[0];
        // Get polygon type of drawed area
        const polygonType = drawedArea?.features?.[0]?.geometry?.type;
        // Create new coordinates array having all existing coordinates
        drawedCoordinates = drawedArea?.features?.map(drawedFeature => {
          return drawedFeature.geometry.coordinates; 
        });

        // Add the new polygon
        drawedCoordinates.push([newPolygonCoordinates]);

        newFeatures = [{
          ...drawedArea?.features?.[0],
          geometry: {
            // Set type based on coordinates structure
            type: isDrawingMultiPolygonActive ? 'MultiPolygon' : polygonType,
            coordinates: drawedCoordinates
          }
        }];
      }

      // If it's not a multi-polygon: Replace coordinates
      else {
        newFeatures = e.features;
      }
    }
    
    // Set drawed area into state
    setDrawedArea({
      type: e.type,
      features: newFeatures
    });

    // Disable drawing mode for multi polygons
    setIsDrawingMultiPolygonActive(false);
  }

  useEffect(() => {
    //  ('state', 'drawedArea', drawedArea);
  }, [drawedArea]);

  const deletePolygonFromMultiPolygon = (lngLat, features) => {
    if(! window.confirm('Weet je zeker dat je dit gebied wilt verwijderen van de multipolygon?')) return;
    
    // Get all polygons of the multi polygon
    const polygons = features[0].geometry.coordinates || [];

    // Loop through all polygons, and check if the clicked point is within the polygon
    const newCoordinates = polygons.filter(polygon => {
      // Check if the clicked point is within the polygon
      return ! booleanPointInPolygon([lngLat.lng, lngLat.lat], { type: 'Polygon', coordinates: polygon });
    });

    const isStillMultiPolygon = newCoordinates.length > 1;

    const newFeatures = [{
      ...features?.[0],
      geometry: {
        ...features?.[0].geometry,
        type: isStillMultiPolygon ? 'MultiPolygon' : 'Polygon',
        coordinates: isStillMultiPolygon ? newCoordinates : newCoordinates[0]
      }
    }];

    // Set updated area into state
    setDrawedArea({
      type: isStillMultiPolygon ? 'MultiPolygon' : 'Polygon',
      features: newFeatures
    });

    // setIsDrawingMultiPolygonActive(false);

    // Save updates into the databaes
    (async () => {
      const activeZone = policyHubs.find(x => x.zone_id === features[0].properties.id);
      if(! activeZone) return;

      // Update zone
      activeZone.area = newFeatures[0];

      const updatedZone = await patchHub(token, activeZone);
      if(updatedZone && updatedZone.detail) {
        notify(toast, 'Er ging iets fout bij het opslaan: ' + updatedZone?.detail, {
          title: 'Er ging iets fout',
          variant: 'destructive'
        })
        return;
      }
      // Update hubs
      fetchHubs();
      // Notify
      notify(toast, 'Zone opgeslagen');
    })();
  }

  const clickHandler = (e) => {
    if(! map) return;

    const isMultiPolygon = e.features[0].geometry.type === 'MultiPolygon';
    const isMultiPolygonWithMoreThanOnePolygon = isMultiPolygon && e.features[0].geometry.coordinates.length > 1;
    const isInConceptPhase = active_phase === 'concept';

    // Handle right click for context menu (delete polygon from multi polygon)
    if (
      e.originalEvent.button === 2
      && canEditHubs(acl)
      && isInConceptPhase
      && (
        (isMultiPolygon && isMultiPolygonWithMoreThanOnePolygon)
      )
    ) {
      e.preventDefault();
      const features = e.features;
      setContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        visible: true,
        hubId: e.features[0].properties.id,
        onDeletePolygonFromMultiPolygon: () => deletePolygonFromMultiPolygon(e.lngLat, features)
      });
      return;
    }

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

  const didSelectHub = () => {
    // If we did draw a new polygon, return true
    if(selected_policy_hubs && selected_policy_hubs[0] === 'new') return true;
    // Oth`erwise: Check if a hub is selected
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

  return <>
    <div className="flex items-center gap-2">
      <PolicyHubsPhaseMenu />
    </div>

    <PolicyHubsActionBar
      draw={draw}
      policyHubs={policyHubs}
      fetchHubs={fetchHubs}
      drawed_area={drawedArea}
      setDrawedArea={setDrawedArea}
      setIsDrawingMultiPolygonActive={setIsDrawingMultiPolygonActive}
    />

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

    {/* Show context menu on right click */}
    {contextMenu.visible && <ContextMenu
      contextMenu={contextMenu}
      setContextMenu={setContextMenu}
      onDeletePolygonFromMultiPolygon={contextMenu.onDeletePolygonFromMultiPolygon}
    />}
  </>
}

export default DdPolicyHubsLayer;
