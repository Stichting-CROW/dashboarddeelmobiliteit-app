const initialState = {
  visible: false,
  gebied: "",
  zones: "",
  datum: (new Date()).toISOString(),
  aanbieders: ""
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
          zones: ""
      };
    }

    case 'SET_FILTER_DATUM': {
      console.log('reducer filter set datum to %s', action.payload)
      return {
          ...state,
          datum: action.payload
      };
    }
    case 'ADD_TO_FILTER_ZONES': {
      console.log('add item %s to zones filter %o', action.payload, state)
      let zones = [];
      if(state.zones) {
        try {
          zones = state.zones.split(",") || []
        } catch(ex) {
          zones = [];
        }
      }
      if(!zones.includes(action.payload)) {
        zones.push(action.payload);
      }

      return {
          ...state,
          zones: zones.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_ZONES': {
      console.log('remove item %s to zones filter', action.payload)
      let zones = state.zones.split(",") || [];
      zones = zones.filter((item) => { return item !== action.payload });

      return {
          ...state,
          zones: zones.join(",")
      };
    }
    case 'CLEAR_FILTER_ZONES': {
      console.log('clear zones filter')

      return {
          ...state,
          zones: []
      };
    }
    case 'ADD_TO_FILTER_AANBIEDERS': {
      console.log('add item %s to aanbieders filter %o', action.payload, state)
      let aanbieders = [];
      if(state.aanbieders) {
        aanbieders = state.aanbieders.split(",") || []
      }
      if(!aanbieders.includes(action.payload)) {
        aanbieders.push(action.payload);
      }
    
      return {
          ...state,
          aanbieders: aanbieders.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_AANBIEDERS': {
      console.log('remove item %s to aanbieders filter', action.payload)
      let aanbieders = state.aanbieders.split(",") || [];
      aanbieders = aanbieders.filter((item) => { return item !== action.payload });
    
      return {
          ...state,
          aanbieders: aanbieders.join(",")
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
