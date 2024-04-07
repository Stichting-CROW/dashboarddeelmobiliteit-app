const initialState = {
  active_phase: null
}

export default function policy_hubs(state = initialState, action) {
  switch(action.type) {
    case 'SET_ACTIVE_PHASE': {
      return {
        active_phase: action.payload
      }
    }
    default:
      return state;
  }

}
