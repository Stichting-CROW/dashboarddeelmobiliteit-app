const initialState = {
  data: null
}

export default function verhuur(state = initialState, action) {
  switch(action.type) {
    case 'SET_VERHUURDATA': {
      const vehicles = action.payload
      return {
        data: vehicles
      }
    }
    case 'CLEAR_VERHUURDATA': {
      return {
        data: []
      }
    }
    default:
      return state;
  }

}
