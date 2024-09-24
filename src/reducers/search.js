const initialState = {
  query: ''
}

export default function ui(state = initialState, action) {
  switch(action.type) {
    case 'SET_SEARCH_BAR_QUERY': {
      return {
        ...state,
        query: action.payload
      };
    }
    default:
      return state;
  }
}
