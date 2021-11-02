const md5 = require('md5');

const initialState = {
  data: [],
  filter: ""
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'SET_ZONES_GEODATA': {
      let currentdata = state.data ? state.data: [];
    
      //console.log("filter - %o / %o", currentdata, action.payload.data)
      if(md5(currentdata)===md5(action.payload.data)&&
         state.filter===action.payload.filter) {
        // console.log('SET_ZONES_GEODATA - no changes')
        return state;
      }
      
      // if(md5(currentdata)!==md5(action.payload.data)) { console.log('SET_ZONES_GEODATA - data changed')}
      // if(state.filter!==action.payload.filter) { console.log('SET_ZONES_GEODATA - filter changed')}
      
      return {
          ...state,
          data: action.payload.data,
          filter: action.payload.filter
      };
    }

    default:
      return state;
  }
}
