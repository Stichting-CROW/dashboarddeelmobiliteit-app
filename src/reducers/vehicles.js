const initialState = {
  data: null
}

export default function vehicles(state = initialState, action) {
  switch(action.type) {
    case 'SET_VEHICLES': {
      console.log("Set Vehicles %o", action.payload);
      const vehicles = action.payload
      return {
        data: vehicles
      }
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
    }
    case 'CLEAR_VEHICLES': {
      return {
        data: []
      }
    }
    default:
      return state;
  }

}
