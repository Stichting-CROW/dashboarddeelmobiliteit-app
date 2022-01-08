
export const DISPLAYMODE_PARK = 'displaymode-park';
export const DISPLAYMODE_RENTALS = 'displaymode-rentals';
export const DISPLAYMODE_OTHER = 'displaymode-other';

export const DISPLAYMODE_PARKEERDATA_HEATMAP = 'parkeerdata-heatmap';
export const DISPLAYMODE_PARKEERDATA_CLUSTERS = 'parkeerdata-clusters';
export const DISPLAYMODE_PARKEERDATA_VOERTUIGEN = 'parkeerdata-voertuigen';
export const DISPLAYMODE_VERHUURDATA_HEATMAP = 'verhuurdata-heatmap';
export const DISPLAYMODE_VERHUURDATA_CLUSTERS = 'verhuurdata-clusters';
export const DISPLAYMODE_VERHUURDATA_VOERTUIGEN = 'verhuurdata-voertuigen';

export const DATASOURCE_VOERTUIGEN = 'vehicles';
export const DATASOURCE_VERHUUR = 'rentals';

const initialState = {
  zones_visible: false,
  displaymode: DISPLAYMODE_PARK,
  view_park: DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  view_rentals: DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
  extent: [],
  mapextent: [],
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
    case 'LAYER_TOGGLE_ZONES_VISIBLE': {
      // console.log('reducer layer set zones visible %s', !state.zones_visible)
      return {
          ...state,
          zones_visible: !state.zones_visible
      };
    }
    case 'LAYER_SET_ZONES_EXTENT': {
      if(md5(JSON.stringify(action.payload||[]))!==md5(JSON.stringify(state.extent||[]))) {
        console.log("set extent to %o", action.payload)
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
    case 'IMPORT_STATE': {
      console.log('import layers')
      
      return {
        ...state,
        ...action.payload.layers
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      console.log('login/logout - reset layer info')
      
      return initialState;
    }
    default:
      return state;
  }
}
