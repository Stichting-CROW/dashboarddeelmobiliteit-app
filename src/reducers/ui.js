const initialState = {
  FILTERBAR: true,
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
    default:
      return state;
  }
}
