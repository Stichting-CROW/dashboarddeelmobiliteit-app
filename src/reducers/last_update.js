export default function lastUpdate(state = false, action) {
  switch(action.type) {
    case 'SET_LAST_UPDATE': {
      return action.payload;
    }

    default:
      return state;
  }
}
