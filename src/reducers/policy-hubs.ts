const initialState = {
  active_phase: null,
  visible_layers: []
}

export default function policy_hubs(state = initialState, action) {
  switch(action.type) {
    case 'SET_ACTIVE_PHASE': {
      return {
        ...state,
        active_phase: action.payload
      }
    }
    case 'TOGGLE_VISIBLE_LAYER': {
      // Make sure visible_layers is an array
      if(! state.visible_layers) state.visible_layers = [];

      // Create temporary variable to store new state in
      let new_visible_layers = state.visible_layers;

      // If payload is in array: Remove
      if(state.visible_layers.indexOf(action.payload) > -1) {
        new_visible_layers = state.visible_layers ? state.visible_layers.filter(x => x !== action.payload) : []
      }
      // Otherwise: Add
      else {
        new_visible_layers.push(action.payload);
      }

      return {
          ...state,
          visible_layers: new_visible_layers
      };
    }
    case 'UNSET_VISIBLE_LAYER': {
      let new_visible_layers = (state.visible_layers || []).filter(x => x !== action.payload);

      return {
          ...state,
          visible_layers: new_visible_layers
      };
    }
    case 'SET_VISIBLE_LAYER': {
      let new_visible_layers = state.visible_layers;

      // If key was not yet in visible_layers...
      if((state.visible_layers || []).indexOf(action.payload) <= -1) {
        // ... add this layer to the visible layers
        new_visible_layers.push(action.payload)
      }

      return {
          ...state,
          visible_layers: new_visible_layers
      };
    }
    case 'SET_SELECTED_POLICY_HUBS': {
      // action.payload is an array with IDs
      return {
          ...state,
          selected_policy_hubs: action.payload
      };
    }
    case 'SET_HUBS_IN_DRAWING_MODE': {
      return {
          ...state,
          hubs_in_drawing_mode: action.payload
      };
    }
    case 'SET_IS_DRAWING_ENABLED': {
      return {
          ...state,
          is_drawing_enabled: action.payload
      };
    }
    case 'SET_SHOW_COMMIT_FORM': {
      return {
          ...state,
          show_commit_form: action.payload
      };
    }
    default:
      return state;
  }

}
