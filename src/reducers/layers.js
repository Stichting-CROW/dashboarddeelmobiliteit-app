
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
  }
}

const md5 = require('md5');

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'LAYER_SET_DISPLAYMODE': {
      if(state.displaymode===action.payload) { return state }
      
      // console.log('reducer layer set view_park %s', action.payload)
      return {
          ...state,
          displaymode: action.payload
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
      const currentLayers = state.active_data_layers[displayMode] || [];
      
      if (currentLayers.includes(layerName)) {
        return state; // Layer already active
      }
      
      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: [...currentLayers, layerName]
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
      const currentLayers = state.active_data_layers[displayMode] || [];
      
      if (isVisible) {
        // Hide layer
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
      } else {
        // Show layer
        if (currentLayers.includes(layerName)) {
          return state; // Layer already active
        }
        
        return {
          ...state,
          active_data_layers: {
            ...state.active_data_layers,
            [displayMode]: [...currentLayers, layerName]
          }
        };
      }
    }
    case 'LAYER_SET_ACTIVE_DATA_LAYERS': {
      const { displayMode, layerNames } = action.payload;
      
      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: layerNames
        }
      };
    }
    case 'LAYER_SET_SINGLE_DATA_LAYER': {
      const { displayMode, layerName } = action.payload;
      
      return {
        ...state,
        active_data_layers: {
          ...state.active_data_layers,
          [displayMode]: [layerName] // Only this layer is active
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
      return {
        ...state,
        ...action.payload.layers
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
