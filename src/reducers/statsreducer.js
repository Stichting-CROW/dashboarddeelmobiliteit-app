const initialState = {
  operatorstats_verhuringenchart: [],
  operatorstats_beschikbarevoertuigenchart: [],
  operatorstats_parkeerduurchart: [],
}

export default function statsreducer(state = initialState, action) {
  switch(action.type) {
    case 'SET_OPERATORSTATS_VERHURINGENCHART': {
      return Object.assign({}, state, {
        operatorstats_verhuringenchart: action.payload
      })
    }
    case 'SET_OPERATORSTATS_BESCHIKBAREVOERTUIGENCHART': {
      return Object.assign({}, state, {
        operatorstats_beschikbarevoertuigenchart: action.payload
      })
    }
    case 'SET_OPERATORSTATS_PARKEERDUURCHART': {
      return Object.assign({}, state, {
        operatorstats_parkeerduurchart: action.payload
      })
    }
    case 'CLEAR_STATS':
    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('clear stats state data')
      return initialState;
    }
    
    default:
      return state;
  }
}
