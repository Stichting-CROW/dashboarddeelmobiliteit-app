const initialState = {
  data: null
}

export default function vehicles(state = initialState, action) {
  switch(action.type) {
    case 'SET_TRIPS': {
      const vehicles = action.payload
      return {
        data: vehicles
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      console.log('login/logout - reset trip data')
      
      return {
        data: []
      }
    }
    case 'CLEAR_TRIPS': {
      return {
        data: []
      }
    }
    default:
      return state;
  }

}
