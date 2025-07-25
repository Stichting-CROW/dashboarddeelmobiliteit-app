const md5 = require('md5');

const initialState = {
  data: [],
  filter: ""
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'SET_ZONES_GEODATA': {
      let currentdata = state.data ? state.data: [];

      let datachanged = md5(JSON.stringify(currentdata))!==md5(JSON.stringify(action.payload.data))
      let filterchanged = state.filter!==action.payload.filter;

      console.log('zones_geodata reducer: SET_ZONES_GEODATA action received', {
        datachanged,
        filterchanged,
        currentDataLength: currentdata?.features?.length,
        newDataLength: action.payload.data?.features?.length,
        newFilter: action.payload.filter
      });

      // Always update if we have new data with features, even if it appears to be the same
      // This ensures the zones source effect is triggered when zones become visible
      const hasNewFeatures = action.payload.data?.features?.length > 0;
      const shouldUpdate = datachanged || filterchanged || hasNewFeatures;

      if(!shouldUpdate) {
        console.log('zones_geodata reducer: No changes detected, returning current state');
        return state;
      }
      
      console.log('zones_geodata reducer: Updating zones data');
      return {
          ...state,
          data: action.payload.data,
          filter: action.payload.filter
      };
    }

    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('login/logout - reset rentals data')      
      return initialState;
    }

    default:
      return state;
  }
}
