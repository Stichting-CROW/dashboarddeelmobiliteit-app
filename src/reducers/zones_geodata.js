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

      // if(datachanged) { console.log('SET_ZONES_GEODATA - data changed')}
      // if(filterchanged) { console.log('SET_ZONES_GEODATA - filter changed')}
      
      if(!datachanged&&!filterchanged) {
        // console.log('SET_ZONES_GEODATA - no changes')
        return state;
      }
      
      // console.log('SET_ZONES_GEODATA - changes: data %s / filter %s', datachanged, filterchanged)
      return {
          ...state,
          data: action.payload.data,
          filter: action.payload.filter
      };
    }

    case 'LOGIN':
    case 'LOGOUT': {
      console.log('login/logout - reset rentals data')
      
      return initialState;
    }

    default:
      return state;
  }
}
