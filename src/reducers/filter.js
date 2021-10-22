const initialState = {
  visible: false,
  gebied: "",
  zones: [],
  datum: null,
  aanbieders: []
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'SET_FILTER_VISIBLE': {
      console.log('reducer filter set filter visible %s', action.payload)
      return {
          ...state,
          visible: action.payload
      };
    }
    case 'SET_FILTER_GEBIED': {
      console.log('reducer filter set gebied to %s', action.payload)
      return {
          ...state,
          gebied: action.payload,
          zones: []
      };
    }
    // case 'ADD_TO_FILTER_ZONES': {
    //   console.log('add item %s to zones filter', action.payload)
    //   if(!state.filter.zones.includes(action.payload)) {
    //     state.filter.zones.push(action.payload);
    //   }
    //
    //   return {
    //       ...state,
    //       zones: state.filter.zones
    //   };
    // }
    // case 'REMOVE_FROM_FILTER_ZONES': {
    //   console.log('remove item %s to zones filter', action.payload)
    //   let zones = state.filter.zones.filter((item) => { return item !== action.payload });
    //
    //   return {
    //       ...state,
    //       zones
    //   };
    // }
    // case 'CLEAR_FILTER_ZONES': {
    //   console.log('clear zones filter')
    //
    //   return {
    //       ...state,
    //       zones: []
    //   };
    // }
    case 'ADD_TO_FILTER_AANBIEDERS': {
      console.log('add item %s to aanbieders filter %o', action.payload, state.filter)
      let aanbieders = state.filter.aanbieders || [];
      if(!aanbieders.includes(action.payload)) {
        aanbieders.push(action.payload);
      }
    
      return {
          ...state,
          aanbieders: state.filter.aanbieders
      };
    }
    case 'REMOVE_FROM_FILTER_AANBIEDERS': {
      console.log('remove item %s to aanbieders filter', action.payload)
      let aanbieders = state.filter.aanbieders || [];
      aanbieders = aanbieders.filter((item) => { return item !== action.payload });
    
      return {
          ...state,
          aanbieders
      };
    }
    case 'CLEAR_FILTER_AANBIEDERS': {
      console.log('clear aanbieders filter')
    
      return {
          ...state,
          aanbieders: []
      };
    }
    default:
      return state;
  }
}
