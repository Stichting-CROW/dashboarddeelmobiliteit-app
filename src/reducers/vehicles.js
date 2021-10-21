const initialState = {
  data: null
}

export default function(state = initialState, action) {
  switch(action.type) {
    case 'SET_VEHICLES': {
      const vehicles = action.payload
      return {
        data: vehicles
      }
      break;
    }
    case 'SET_VEHICLE': {
      const vehicle = action.payload
      // Validate input
      if(! vehicle.uuid) {
        return {}
      }
      // Remove changed vehicle
      const filtered = state.data.filter(function(x) {
        return x.uuid !== vehicle.uuid;
      });
      // Add vehicle to vehicles set
      filtered.push(vehicle)
      // Set store
      return { data: filtered }
      break;
    }
    case 'CLEAR_VEHICLES': {
      return {
        data: []
      }
      break;
    }
    default:
      return state;
  }

}
