const initialState = {
  data: [],
  operatorstats: [],
}

export default function vehicles(state = initialState, action) {
  switch(action.type) {
    case 'SET_VEHICLES': {
      // console.log("Set Vehicles %o", action.payload);
      const vehicles = action.payload
      return {
        ...state,
        data: vehicles
      }
    }
    case 'SET_VEHICLES_OPERATORSTATS': {
      // console.log("Set Vehicles %o", action.payload);
      return {
        ...state,
        operatorstats: action.payload
      }
    }
    case 'CLEAR_VEHICLES': {
      return {
        ...state,
        data: [],
        operatorstats: []
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      console.log('login/logout - reset vehicles data')
      
      return { data: [], operatorstats: [] };
    }
    
    default:
      return state;
  }

}
