const initialState = {
  FILTERBAR: window.innerWidth > 800 ? true : false,
  SELECTLAYER: true,
  SHOWLOADING: false
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
    case 'SHOW_LOADING': {
      // console.log("set show loading %s",action.payload)
      return {
        ...state,
        showloading: action.payload
      };
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
