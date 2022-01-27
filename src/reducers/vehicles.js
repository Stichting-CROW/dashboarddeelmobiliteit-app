const initialState = {
  data: [],
  operatorstats: [],
}

export default function vehicles(state = initialState, action) {
  switch(action.type) {
    case 'SET_VEHICLES': {
      return {
        data: action.payload,
        operatorstats: []
      }
    }
    case 'SET_VEHICLES_OPERATORSTATS': {
      return Object.assign({}, state, {
        operatorstats: action.payload
      })
    }
    case 'CLEAR_VEHICLES': {
      return {
        data: [],
        operatorstats: []
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('login/logout - reset vehicles data')      
      return initialState;
    }
    
    default:
      return state;
  }
}
