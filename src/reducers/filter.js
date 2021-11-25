const initialState = {
  visible: true,
  gebied: "",
  zones: "",
  datum: (new Date()).toISOString(),
  intervalstart: (new Date()).toISOString(),
  intervalend: (new Date()).toISOString(),
  aanbiedersexclude: "",
  markersexclude: "",
  voertuigtypesexclude: "",
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
      if(state.gebied===action.payload) {
        return state;
      }
      
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
    case 'SET_FILTER_INTERVAL_START': {
      console.log('reducer filter set interval start to %s', action.payload)
      return {
          ...state,
          intervalstart: action.payload
      };
    }
    case 'SET_FILTER_INTERVAL_END': {
      console.log('reducer filter set interval end to %s', action.payload)
      return {
          ...state,
          intervalend: action.payload
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
      console.log('remove item %o from zones filter', action.payload)
      let zones = state.zones.split(",") || [];
      zones = zones.filter((item) => {return item.toString() !== action.payload.toString() });

      return {
          ...state,
          zones: zones.join(",")
      };
    }
    case 'CLEAR_FILTER_ZONES': {
      console.log('clear zones filter')

      return {
          ...state,
          zones: ''
      };
    }
    case 'ADD_TO_FILTER_MARKERS_EXCLUDE': {
      let markersexclude = [];
      try {
        console.log('add item %s to markersexclude filter %o', action.payload, state)
        if(state.markersexclude) {
          try {
            markersexclude = state.markersexclude.split(",") || []
          } catch(ex) {
            markersexclude = [];
          }
        }
        if(!markersexclude.includes(action.payload)) {
          markersexclude.push(action.payload);
        }
      } catch(ex) {
        markersexclude = [];
      }

      return {
        ...state,
        markersexclude: markersexclude.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_MARKERS_EXCLUDE': {
      console.log('remove item %o from markersexclude filter', action.payload)
      let markersexclude = [];
      try {
        markersexclude = state.markersexclude.split(",") || [];
        markersexclude = markersexclude.filter((item) => {return item.toString() !== action.payload.toString() });
      } catch(ex) {
        markersexclude = [];
      }

      return {
          ...state,
          markersexclude: markersexclude.join(",")
      };
    }
    case 'CLEAR_FILTER_MARKERS_EXCLUDE': {
      console.log('clear markersexclude filter')

      return {
          ...state,
          markersexclude: ''
      };
    }
    case 'ADD_TO_FILTER_VOERTUIGTYPES_EXCLUDE': {
      let voertuigtypesexclude = [];
      try {
        console.log('add item %s to voertuigtypesexclude filter %o', action.payload, state)
        if(state.voertuigtypesexclude) {
          try {
            voertuigtypesexclude = state.voertuigtypesexclude.split(",") || []
          } catch(ex) {
            voertuigtypesexclude = [];
          }
        }
        if(!voertuigtypesexclude.includes(action.payload)) {
          voertuigtypesexclude.push(action.payload);
        }
      } catch(ex) {
        voertuigtypesexclude = [];
      }

      return {
        ...state,
        voertuigtypesexclude: voertuigtypesexclude.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_VOERTUIGTYPES_EXCLUDE': {
      console.log('remove item %o from voertuigtypesexclude filter', action.payload)
      let voertuigtypesexclude = [];
      try {
        voertuigtypesexclude = state.voertuigtypesexclude.split(",") || [];
        voertuigtypesexclude = voertuigtypesexclude.filter((item) => {return item.toString() !== action.payload.toString() });
      } catch(ex) {
        voertuigtypesexclude = [];
      }

      return {
          ...state,
          voertuigtypesexclude: voertuigtypesexclude.join(",")
      };
    }
    case 'CLEAR_FILTER_VOERTUIGTYPES_EXCLUDE': {
      console.log('clear voertuigtypesexclude filter')

      return {
          ...state,
          voertuigtypesexclude: ''
      };
    }
    case 'ADD_TO_FILTER_AANBIEDERS_EXCLUDE': {
      // console.log('add item %s to aanbiedersexclude filter %o', action.payload, state)
      let aanbiedersexclude = [];
      try {
        if(state.aanbiedersexclude) {
          aanbiedersexclude = state.aanbiedersexclude.split(",") || []
        }
        if(!aanbiedersexclude.includes(action.payload)) {
          aanbiedersexclude.push(action.payload);
        }
      } catch(ex) {
        aanbiedersexclude = [];
      }
    
      return {
          ...state,
          aanbiedersexclude: aanbiedersexclude.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_AANBIEDERS_EXCLUDE': {
      console.log('remove item %s from aanbiedersexclude filter', action.payload)
      let aanbiedersexclude = [];
      try {
        aanbiedersexclude = state.aanbiedersexclude.split(",") || [];
        aanbiedersexclude = aanbiedersexclude.filter((item) => { return item !== action.payload });
      } catch(ex) {
        aanbiedersexclude = [];
      }
    
      return {
          ...state,
          aanbiedersexclude: aanbiedersexclude.join(",")
      };
    }
    case 'CLEAR_FILTER_AANBIEDERS_EXCLUDE': {
      console.log('clear aanbiedersexclude filter')
    
      return {
          ...state,
          aanbiedersexclude: ''
      };
    }
    case 'RESET_FILTER': {
      console.log('reset filter')
      
      return initialState;
    }
    default:
      return state;
  }
}
