import { normalizeFilterbarExtended } from '../helpers/filterbarExtendedState';
import { FILTERBAR_EXTENDED_CLOSED } from '../types/FilterbarExtendedState';

const initialState = {
  FILTERBAR: window.innerWidth > 800 ? true : false,
  SELECTLAYER: true,
  SHOWLOADING: false,
  FILTERBAR_EXTENDED: FILTERBAR_EXTENDED_CLOSED,
}

export default function ui(state = initialState, action) {
  switch(action.type) {
    case 'SET_VISIBILITY': {
      return {
        ...state,
        [action.payload.name]: action.payload.visibility
      };
    }
    case 'SET_FILTERBAR_EXTENDED': {
      return {
        ...state,
        FILTERBAR_EXTENDED: normalizeFilterbarExtended(action.payload),
      };
    }
    case 'IMPORT_STATE': {
      console.log('import ui')
      const importedUi = { ...action.payload.ui };
      if ('FILTERBAR_EXTENDED' in importedUi) {
        importedUi.FILTERBAR_EXTENDED = normalizeFilterbarExtended(
          importedUi.FILTERBAR_EXTENDED
        );
      }

      return {
        ...state,
        ...importedUi
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
      // console.log('login/logout - reset ui data')      
      return initialState;
    }
    default:
      return state;
  }
}
