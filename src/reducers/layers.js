export const DISPLAYMODE_PARKEERDATA_HEATMAP = 'parkeerdata-heatmap';
export const DISPLAYMODE_PARKEERDATA_CLUSTERS = 'parkeerdata-clusters';
export const DISPLAYMODE_PARKEERDATA_VOERTUIGEN = 'parkeerdata-voertuigen';

export const DATASOURCE_VOERTUIGEN = 'vehicles';

const initialState = {
  zones_visible: false,
  displaymode: DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  extent: [],
}

const md5 = require('md5');

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'LAYER_SET_DISPLAYMODE': {
      // console.log('reducer layer set displaymode %s', action.payload)
      return {
          ...state,
          displaymode: action.payload
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
      if(md5(JSON.stringify(action.payload))!==md5(JSON.stringify(state.extent||[]))) {
        console.log("set extent to %o", action.payload)
        return {
            ...state,
            extent: action.payload
        };
      } else {
        // console.log("set extent - not changed")
        return state;
      }
    }
    default:
      return state;
  }
}
