const initialState = {
  // FILTERBAR: true,
  SELECTLAYER: true
}

export default function ui(state = initialState, action) {
  switch(action.type) {
    case 'SET_VISIBILITY': {
      return {
        ...state,
        [action.payload.name]: action.payload.visibility
      };
    }
    case 'IMPORT_STATE': {
      console.log('import ui')
      
      return {
        ...state,
        ...action.payload.ui
      }
    }
    case 'LOGIN':
    case 'LOGOUT': {
      console.log('login/logout - reset ui data')
      
      return initialState;
    }
    default:
      return state;
  }
}
