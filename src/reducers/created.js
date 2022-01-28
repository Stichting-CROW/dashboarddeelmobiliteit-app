export default function created(state = false, action) {
  switch(action.type) {
    case 'SET_CREATED': {
      return action.payload;
    }

    default:
      return state;
  }
}
