
export const DISPLAYMODE_PARK = 'displaymode-park';
export const DISPLAYMODE_RENTALS = 'displaymode-rentals';
export const DISPLAYMODE_ZONES_ADMIN = 'displaymode-zones-admin';
export const DISPLAYMODE_ZONES_PUBLIC = 'displaymode-zones-public';
export const DISPLAYMODE_SERVICE_AREAS = 'displaymode-service-areas';
export const DISPLAYMODE_POLICY_HUBS = 'displaymode-policy-hubs';
export const DISPLAYMODE_OTHER = 'displaymode-other';

export const DISPLAYMODE_PARKEERDATA_HEATMAP = 'parkeerdata-heatmap';
export const DISPLAYMODE_PARKEERDATA_CLUSTERS = 'parkeerdata-clusters';
export const DISPLAYMODE_PARKEERDATA_VOERTUIGEN = 'parkeerdata-voertuigen';

export const DISPLAYMODE_VERHUURDATA_HB = 'verhuurdata-hb';
export const DISPLAYMODE_VERHUURDATA_HEATMAP = 'verhuurdata-heatmap';
export const DISPLAYMODE_VERHUURDATA_CLUSTERS = 'verhuurdata-clusters';
export const DISPLAYMODE_VERHUURDATA_VOERTUIGEN = 'verhuurdata-voertuigen';

export const DISPLAYMODE_START = 'start';
export const DISPLAYMODE_DASHBOARD = 'vergunningseisen';

export const DATASOURCE_VOERTUIGEN = 'vehicles';
export const DATASOURCE_VERHUUR = 'rentals';

export const DATA_LAYER_ORDER_GROUP = 'data-group';
export const DATA_LAYER_ORDER_CBS = 'cbs-zones';
export const DATA_LAYER_ORDER_SERVICE_AREAS = 'servicegebieden';
export const DATA_LAYER_ORDER_HUBS = 'hubs';
export const DATA_LAYER_ORDER_VERBODSGEBIEDEN = 'verbodsgebieden';

export const VALID_DATA_LAYER_ORDER_IDS = [
  DATA_LAYER_ORDER_GROUP,
  DATA_LAYER_ORDER_CBS,
  DATA_LAYER_ORDER_SERVICE_AREAS,
  DATA_LAYER_ORDER_HUBS,
  DATA_LAYER_ORDER_VERBODSGEBIEDEN
];

// Overlay layers (Andere datalaag) that can be toggled per display mode
export const VALID_OVERLAY_LAYER_IDS = [
  DATA_LAYER_ORDER_SERVICE_AREAS,
  DATA_LAYER_ORDER_HUBS,
  DATA_LAYER_ORDER_VERBODSGEBIEDEN
];

export const VALID_OVERLAY_PHASES = [
  'concept',
  'committed_concept',
  'published',
  'active'
];

export const DEFAULT_DATA_LAYER_ORDER = {
  'displaymode-park': [
    DATA_LAYER_ORDER_GROUP,
    DATA_LAYER_ORDER_CBS,
    DATA_LAYER_ORDER_SERVICE_AREAS,
    DATA_LAYER_ORDER_HUBS,
    DATA_LAYER_ORDER_VERBODSGEBIEDEN
  ],
  'displaymode-rentals': [
    DATA_LAYER_ORDER_GROUP,
    DATA_LAYER_ORDER_CBS,
    DATA_LAYER_ORDER_SERVICE_AREAS,
    DATA_LAYER_ORDER_HUBS,
    DATA_LAYER_ORDER_VERBODSGEBIEDEN
  ],
  'displaymode-service-areas': [
    DATA_LAYER_ORDER_SERVICE_AREAS,
    DATA_LAYER_ORDER_HUBS,
    DATA_LAYER_ORDER_VERBODSGEBIEDEN,
    DATA_LAYER_ORDER_CBS
  ],
  'displaymode-policy-hubs': [
    DATA_LAYER_ORDER_HUBS,
    DATA_LAYER_ORDER_VERBODSGEBIEDEN,
    DATA_LAYER_ORDER_SERVICE_AREAS,
    DATA_LAYER_ORDER_CBS
  ]
};

export const DEFAULT_OVERLAY_LAYERS = {
  enabled: {
    'displaymode-park': [],
    'displaymode-rentals': [],
    'displaymode-service-areas': [DATA_LAYER_ORDER_SERVICE_AREAS],
    'displaymode-policy-hubs': []
  },
  phases: {
    [DATA_LAYER_ORDER_HUBS]: 'active',
    [DATA_LAYER_ORDER_VERBODSGEBIEDEN]: 'active'
  }
};

const initialState = {
  zones_visible: false,
  displaymode: DISPLAYMODE_PARK,
  view_park: DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  view_rentals: DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
  map_style: 'base', // Default to base map style
  extent: [],
  mapextent: [],
  // New data layer state for multiple active layers
  active_data_layers: {
    'displaymode-park': [DISPLAYMODE_PARKEERDATA_VOERTUIGEN],
    'displaymode-rentals': [DISPLAYMODE_VERHUURDATA_VOERTUIGEN]
  },
  // Top-first list order; controls map z-order for Andere datalaag items
  data_layer_order: {
    'displaymode-park': [...DEFAULT_DATA_LAYER_ORDER['displaymode-park']],
    'displaymode-rentals': [...DEFAULT_DATA_LAYER_ORDER['displaymode-rentals']],
    'displaymode-service-areas': [...DEFAULT_DATA_LAYER_ORDER['displaymode-service-areas']],
    'displaymode-policy-hubs': [...DEFAULT_DATA_LAYER_ORDER['displaymode-policy-hubs']]
  },
  // Toggleable overlay layers (servicegebieden/hubs/verbodsgebieden) per display mode
  overlay_layers: {
    enabled: {
      ...DEFAULT_OVERLAY_LAYERS.enabled
    },
    phases: {
      ...DEFAULT_OVERLAY_LAYERS.phases
    }
  }
}

const md5 = require('md5');

const VALID_DATA_LAYERS = {
  'displaymode-park': [
    DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
    DISPLAYMODE_PARKEERDATA_CLUSTERS,
    DISPLAYMODE_PARKEERDATA_HEATMAP
  ],
  'displaymode-rentals': [
    DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
    DISPLAYMODE_VERHUURDATA_CLUSTERS,
    DISPLAYMODE_VERHUURDATA_HEATMAP,
    DISPLAYMODE_VERHUURDATA_HB
  ]
};

/**
 * Ensure a display mode has at most one active data layer.
 * If multiple layers are active, keep only the first valid one and fall back
 * to the default when none of the active layers is valid.
 */
export const sanitizeActiveDataLayers = (activeDataLayers) => {
  if (!activeDataLayers || typeof activeDataLayers !== 'object') {
    return initialState.active_data_layers;
  }

  const validDisplayModes = Object.keys(initialState.active_data_layers);
  const sanitized = {};
  let didNormalize = false;

  validDisplayModes.forEach(displayMode => {
    const validLayers = VALID_DATA_LAYERS[displayMode] || [];
    const currentLayers = activeDataLayers[displayMode];

    if (!Array.isArray(currentLayers) || currentLayers.length === 0) {
      sanitized[displayMode] = [initialState.active_data_layers[displayMode][0]];
      return;
    }

    // Keep only the first valid active layer
    const firstValid = currentLayers.find(layer => validLayers.includes(layer));
    const normalized = firstValid
      ? [firstValid]
      : [initialState.active_data_layers[displayMode][0]];
    sanitized[displayMode] = normalized;

    if (currentLayers.length > 1 || !currentLayers.includes(normalized[0])) {
      didNormalize = true;
    }
  });

  if (didNormalize && process.env.NODE_ENV === 'development') {
    console.warn('Normalized active_data_layers to single-layer mode:', activeDataLayers, '->', sanitized);
  }

  return sanitized;
};

/**
 * Ensure each display mode has a complete, valid data-layer order.
 * Unknown ids are dropped; missing ids are appended from the default.
 */
export const sanitizeDataLayerOrder = (dataLayerOrder) => {
  if (!dataLayerOrder || typeof dataLayerOrder !== 'object') {
    const defaults = {};
    Object.keys(DEFAULT_DATA_LAYER_ORDER).forEach((displayMode) => {
      defaults[displayMode] = [...DEFAULT_DATA_LAYER_ORDER[displayMode]];
    });
    return defaults;
  }

  const sanitized = {};
  Object.keys(DEFAULT_DATA_LAYER_ORDER).forEach((displayMode) => {
    const defaults = DEFAULT_DATA_LAYER_ORDER[displayMode];
    const current = dataLayerOrder[displayMode];
    if (!Array.isArray(current)) {
      sanitized[displayMode] = [...defaults];
      return;
    }

    // Only keep ids that are valid for this display mode
    const valid = current.filter((id) => defaults.includes(id));
    defaults.forEach((id) => {
      if (!valid.includes(id)) {
        valid.push(id);
      }
    });
    sanitized[displayMode] = valid;
  });

  return sanitized;
};

/**
 * Ensure the overlay layers state (enabled + phases) is complete and valid.
 */
export const sanitizeOverlayLayers = (overlayLayers) => {
  const sanitized = {
    enabled: {},
    phases: {}
  };

  Object.keys(DEFAULT_OVERLAY_LAYERS.enabled).forEach((displayMode) => {
    const current = overlayLayers?.enabled?.[displayMode];
    if (!Array.isArray(current)) {
      sanitized.enabled[displayMode] = [...DEFAULT_OVERLAY_LAYERS.enabled[displayMode]];
      return;
    }
    sanitized.enabled[displayMode] = current.filter((id) => VALID_OVERLAY_LAYER_IDS.includes(id));
  });

  Object.keys(DEFAULT_OVERLAY_LAYERS.phases).forEach((layerId) => {
    const current = overlayLayers?.phases?.[layerId];
    sanitized.phases[layerId] = VALID_OVERLAY_PHASES.includes(current)
      ? current
      : DEFAULT_OVERLAY_LAYERS.phases[layerId];
  });

  return sanitized;
};

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'LAYER_SET_DISPLAYMODE': {
      if(state.displaymode===action.payload) { return state }
      
      // Data-layer UI uses radio-button behaviour; clean up any corrupted
      // multi-layer state when switching display modes.
      const sanitizedActiveDataLayers = sanitizeActiveDataLayers(state.active_data_layers);
      
      return {
          ...state,
          displaymode: action.payload,
          active_data_layers: sanitizedActiveDataLayers
      };
    }
    case 'LAYER_SET_VIEW_PARK': {
      if(state.view_park===action.payload) { return state }

      // console.log('reducer layer set view_park %s', action.payload)
      return {
          ...state,
          view_park: action.payload
      };
    }
    case 'LAYER_SET_VIEW_RENTALS': {
      if(state.view_rentals===action.payload) { return state }

      // console.log('reducer layer set view_rentals %s', action.payload)
      return {
        ...state,
        view_rentals: action.payload
      };
    }
    // New data layer management cases
    case 'LAYER_SET_DATA_LAYER': {
      const { displayMode, layerName } = action.payload;
      const validLayers = VALID_DATA_LAYERS[displayMode] || [];
      
      if (!validLayers.includes(layerName)) {
        return state;
      }
      
      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: [layerName] // Only this layer is active
        }
      };
    }
    case 'LAYER_UNSET_DATA_LAYER': {
      const { displayMode, layerName } = action.payload;
      const currentLayers = state.active_data_layers[displayMode] || [];
      
      if (!currentLayers.includes(layerName)) {
        return state; // Layer not active
      }
      
      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: currentLayers.filter(layer => layer !== layerName)
        }
      };
    }
    case 'LAYER_TOGGLE_DATA_LAYER': {
      const { displayMode, layerName, isVisible } = action.payload;
      const validLayers = VALID_DATA_LAYERS[displayMode] || [];
      const defaultLayer = initialState.active_data_layers[displayMode]?.[0];
      
      if (!validLayers.includes(layerName) || !defaultLayer) {
        return state;
      }
      
      if (isVisible) {
        // Hiding the active layer: fall back to the default so the map
        // always has a valid data layer for this display mode.
        return {
          ...state,
          active_data_layers: {
            ...state.active_data_layers,
            [displayMode]: [defaultLayer]
          }
        };
      } else {
        // Showing a layer: make it the only active one.
        return {
          ...state,
          active_data_layers: {
            ...state.active_data_layers,
            [displayMode]: [layerName]
          }
        };
      }
    }
    case 'LAYER_SET_ACTIVE_DATA_LAYERS': {
      const { displayMode, layerNames } = action.payload;
      const validLayers = VALID_DATA_LAYERS[displayMode] || [];
      const firstValid = Array.isArray(layerNames)
        ? layerNames.find(layer => validLayers.includes(layer))
        : null;
      
      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: [firstValid || initialState.active_data_layers[displayMode][0]]
        }
      };
    }
    case 'LAYER_SET_SINGLE_DATA_LAYER': {
      const { displayMode, layerName } = action.payload;
      const validLayers = VALID_DATA_LAYERS[displayMode] || [];
      const defaultLayer = initialState.active_data_layers[displayMode]?.[0];
      if (!defaultLayer) return state; // Unknown display mode

      const safeLayerName = validLayers.includes(layerName)
        ? layerName
        : defaultLayer;

      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: [safeLayerName] // Only this layer is active
        }
      };
    }
    case 'LAYER_SET_DATA_LAYER_ORDER': {
      const { displayMode, order } = action.payload || {};
      if (!DEFAULT_DATA_LAYER_ORDER[displayMode] || !Array.isArray(order)) {
        return state;
      }

      const sanitized = sanitizeDataLayerOrder({
        ...state.data_layer_order,
        [displayMode]: order
      });

      return {
        ...state,
        data_layer_order: sanitized
      };
    }
    case 'LAYER_TOGGLE_OVERLAY_LAYER': {
      const { displayMode, layerId } = action.payload || {};
      if (!VALID_OVERLAY_LAYER_IDS.includes(layerId)) return state;

      const overlayLayers = sanitizeOverlayLayers(state.overlay_layers);
      const current = overlayLayers.enabled[displayMode];
      if (!Array.isArray(current)) return state;

      const enabled = current.includes(layerId)
        ? current.filter((id) => id !== layerId)
        : [...current, layerId];

      return {
        ...state,
        overlay_layers: {
          ...overlayLayers,
          enabled: {
            ...overlayLayers.enabled,
            [displayMode]: enabled
          }
        }
      };
    }
    case 'LAYER_SET_OVERLAY_PHASE': {
      const { layerId, phase } = action.payload || {};
      const overlayLayers = sanitizeOverlayLayers(state.overlay_layers);
      if (!(layerId in overlayLayers.phases)) return state;
      if (!VALID_OVERLAY_PHASES.includes(phase)) return state;

      return {
        ...state,
        overlay_layers: {
          ...overlayLayers,
          phases: {
            ...overlayLayers.phases,
            [layerId]: phase
          }
        }
      };
    }
    case 'LAYER_TOGGLE_ZONES_VISIBLE': {
      // console.log('reducer layer set zones visible %s', !state.zones_visible)
      return {
        ...state,
        zones_visible: !state.zones_visible
      };
    }
    case 'LAYER_SET_MAP_STYLE': {
      return {
        ...state,
        map_style: action.payload
      };
    }
    case 'LAYER_SET_ZONES_EXTENT': {
      if(md5(JSON.stringify(action.payload||[]))!==md5(JSON.stringify(state.extent||[]))) {
        // console.log("set extent to %o", action.payload)
        return {
          ...state,
          extent: action.payload||[]
        };
      } else {
        // console.log("set extent - not changed")
        return state;
      }
    }
    case 'LAYER_SET_MAP_EXTENT': {
      if(md5(JSON.stringify(action.payload))!==md5(JSON.stringify(state.mapextent||false))) {
        // console.log("set extent to %o", action.payload)
        return {
          ...state,
          mapextent: action.payload
        };
      } else {
        // console.log("set extent - not changed")
        return state;
      }
    }
    case 'LAYER_SET_MAP_ZOOM': {
      if(md5(JSON.stringify(action.payload))!==md5(JSON.stringify(state.zoom||false))) {
        // console.log("set zoom to %o", action.payload)
        return {
          ...state,
          zoom: action.payload
        };
      } else {
        // console.log("set zoom - not changed")
        return state;
      }
    }
    case 'IMPORT_STATE': {
      const importedLayers = action.payload.layers || {};
      return {
        ...state,
        ...importedLayers,
        active_data_layers: sanitizeActiveDataLayers(importedLayers.active_data_layers),
        data_layer_order: sanitizeDataLayerOrder(importedLayers.data_layer_order),
        overlay_layers: sanitizeOverlayLayers(importedLayers.overlay_layers)
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('login/logout - reset layer info')      
      return initialState;
    }
    default:
      return state;
  }
}
