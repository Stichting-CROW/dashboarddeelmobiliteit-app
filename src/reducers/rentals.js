const initialState = {
  origins: {},
  destinations: {},
  origins_operatorstats: [],
  destinations_operatorstats: []
}

export default function rentals(state = initialState, action) {
  switch(action.type) {
    case 'SET_RENTALS_ORIGINS': {
      return Object.assign({}, state, {
        origins: action.payload,
        origins_operatorstats: []
      })
    }
    case 'SET_RENTALS_DESTINATIONS': {
      return Object.assign({}, state, {
        destinations: action.payload,
        destinations_operatorstats: []
      })
    }
    case 'CLEAR_RENTALS_ORIGINS': {
      return Object.assign({}, state, {
        origins: [],
        origins_operatorstats: []
      })
    }
    case 'CLEAR_RENTALS_DESTINATIONS': {
      return Object.assign({}, state, {
        destinations: [],
        destinations_operatorstats: []
      })
    }
    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('login/logout - reset rentals data')      
      return initialState;
    }
    case 'SET_RENTALS_ORIGINS_OPERATORSTATS': {
      return Object.assign({}, state, {
        origins_operatorstats: action.payload
      })
    }
    case 'SET_RENTALS_DESTINATIONS_OPERATORSTATS': {
      return Object.assign({}, state, {
        destinations_operatorstats: action.payload
      })
    }
    default:
      return state;
  }
}
