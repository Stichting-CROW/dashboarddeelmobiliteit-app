const initialState = {
  visible_operators: [
    'CHECK',
    'GO Sharing'
  ]
}

export default function service_areas(state = initialState, action) {
  switch(action.type) {
    case 'SHOW_SERVICE_AREA_FOR_OPERATOR': {
      return {
          ...state,
          visible_operators: [action.payload]
      };
    }

    case 'TOGGLE_SERVICE_AREA_FOR_OPERATOR': {
      // Make sure visible_layers is an array
      if(! state.visible_operators) state.visible_operators = [];

      // Create temporary variable to store new state in
      let new_visible_operators = state.visible_operators;

      // If payload is in array: Remove
      if(state.visible_operators.indexOf(action.payload) > -1) {
        new_visible_operators = state.visible_operators ? state.visible_operators.filter(x => x !== action.payload) : []
      }
      // Otherwise: Add
      else {
        new_visible_operators.push(action.payload);
      }

      return {
          ...state,
          visible_operators: new_visible_operators
      };
    }
    default:
      return state;
  }

}
