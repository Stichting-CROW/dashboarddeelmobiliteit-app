const initialState = {
  origins: {},
  destinations: {}
}

export default function rentals(state = initialState, action) {
  switch(action.type) {
    case 'SET_RENTALS_ORIGINS': {
      return Object.assign({}, state, {
        origins: action.payload
      })
    }
    case 'SET_RENTALS_DESTINATIONS': {
      return Object.assign({}, state, {
        destinations: action.payload
      })
    }
    case 'CLEAR_RENTALS_ORIGINS': {
      return Object.assign({}, state, {
        origins: []
      })
    }
    case 'CLEAR_RENTALS_DESTINATIONS': {
      return Object.assign({}, state, {
        destinations: []
      })
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
