const initialState = {
  data: [],
  operatorstats: [],
  loading: false,
}

export default function vehicles(state = initialState, action) {
  switch(action.type) {
    case 'SET_VEHICLES': {
      return {
        ...state,
        data: action.payload,
        operatorstats: state.operatorstats || []
      }
    }
    case 'SET_VEHICLES_OPERATORSTATS': {
      return Object.assign({}, state, {
        operatorstats: action.payload
      })
    }
    case 'SET_VEHICLES_LOADING': {
      return {
        ...state,
        loading: action.payload === true
      };
    }
    case 'CLEAR_VEHICLES': {
      return {
        data: [],
        operatorstats: [],
        loading: false
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      return initialState;
    }
    
    default:
      return state;
  }
}
