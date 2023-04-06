import moment from 'moment';

// Always start with an initial municipality
// This prevents a slow website on initial load
const randomInitialMunicipality = () => {
  const municipalitiesWithLotsOfVehicles = [
    'GM0080',// Leeuwarden
    'GM0014',// Groningen
    // '',// Alkmaar
    'GM0392',// Haarlem
    'GM0034',// Almere
    'GM0193',// Zwolle
    'GM0402',// Hilversum
    'GM0307',// Amersfoort
    'GM0344',// Utrecht
    'GM0200',// Apeldoorn
    'GM0518',// Den Haag
    'GM0599',// Rotterdam
    'GM0758',// Breda,
    'GM0855',// Tilburg
    'GM0772'// Eindhoven
  ];
  const randomMunicipality = municipalitiesWithLotsOfVehicles[Math.floor(Math.random() * municipalitiesWithLotsOfVehicles.length)];
  return randomMunicipality;
}

const initialState = {
  visible: true,
  gebied: randomInitialMunicipality(),
  zones: "",
  datum: (new Date()).toISOString(),
  // intervalstart: (new Date()).toISOString(),
  intervalduur: 60 * 60 * 1000,
  aanbiedersexclude: "",
  parkeerduurexclude: "",
  voertuigtypesexclude: "",
  afstandexclude: "",
  herkomstbestemming: "herkomstbestemming",
  ontwikkelingvan: moment().subtract(30, 'days').toISOString(),
  ontwikkelingtot: (new Date()).toISOString(),
  ontwikkelingaggregatie: "day",
  ontwikkelingaggregatie_function: 'MAX',
  h3niveau: 8,
  weekdays: 'fr,th,mo,tu,we,sa,su',
  timeframes: '6-10,10-14,14-18,18-22,22-2,2-6',
  h3hexes7: [],
  h3hexes8: [],
  h3hexeswijk: []
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'SET_FILTER_VISIBLE': {
      // console.log('reducer filter set filter visible %s', action.payload)
      return {
          ...state,
          visible: action.payload
      };
    }
    case 'SET_FILTER_GEBIED': {
      if(state.gebied===action.payload) {
        return state;
      }
      
      // console.log('reducer filter set gebied to %s', action.payload)
      return {
          ...state,
          gebied: action.payload,
          zones: ""
      };
    }
    case 'SET_FILTER_DATUM': {
      // console.log('reducer filter set datum to %s', action.payload)
      return {
          ...state,
          datum: action.payload
      };
    }
    case 'SET_FILTER_INTERVAL_START': {
      // console.log('reducer filter set interval start to %s', action.payload)
      return {
          ...state,
          intervalstart: action.payload
      };
    }
    case 'SET_FILTER_INTERVAL_END': {
      return {
          ...state,
          intervalend: action.payload
      };
    }
    case 'SET_FILTER_INTERVAL_DUUR': {
      // console.log('reducer filter set interval duration to %s', action.payload)
      return {
          ...state,
          intervalduur: action.payload
      };
    }
    case 'SET_FILTER_HERKOMSTBESTEMMING': {
      // console.log('reducer filter set herkomstbestemming to %s', action.payload)
      return {
          ...state,
          herkomstbestemming: action.payload
      };
    }
    case 'SET_FILTER_H3NIVEAU': {
      return {
          ...state,
          h3niveau: action.payload
      };
    }
    case 'TOGGLE_FILTER_H3HEXES_7': {
      // Make sure state.h3hexes is an array
      let newHexes = state.h3hexes7 instanceof Array ? state.h3hexes7 : [];

      // If payload is in array: Remove
      if(state.h3hexes7 && newHexes.indexOf(action.payload) > -1) {
        newHexes = newHexes.filter(x => x !== action.payload)
      }
      // Otherwise: Add
      else {
        newHexes.push(action.payload);
      }

      return {
          ...state,
          h3hexes7: newHexes
      };
    }
    case 'TOGGLE_FILTER_H3HEXES_8': {
      // Make sure state.h3hexes is an array
      let newHexes = state.h3hexes8 instanceof Array ? state.h3hexes8 : [];

      // If payload is in array: Remove
      if(state.h3hexes8 && newHexes.indexOf(action.payload) > -1) {
        newHexes = newHexes.filter(x => x !== action.payload)
      }
      // Otherwise: Add
      else {
        newHexes.push(action.payload);
      }

      return {
          ...state,
          h3hexes8: newHexes
      };
    }
    case 'TOGGLE_FILTER_H3HEXES_WIJK': {
      // Make sure state.h3hexes is an array
      let newValue = state.h3hexes8 instanceof Array ? state.h3hexeswijk : [];

      // If payload is in array: Remove
      if(state.h3hexeswijk && newValue.indexOf(action.payload) > -1) {
        newValue = newValue.filter(x => x !== action.payload)
      }
      // Otherwise: Add
      else {
        newValue.push(action.payload);
      }

      return {
          ...state,
          h3hexeswijk: newValue
      };
    }
    case 'SET_FILTER_H3HEXES_7': {
      return {
          ...state,
          h3hexes7: [action.payload]
      };
    }
    case 'SET_FILTER_H3HEXES_8': {
      return {
          ...state,
          h3hexes8: [action.payload]
      };
    }
    case 'SET_FILTER_H3HEXES_WIJK': {
      return {
          ...state,
          h3hexeswijk: [action.payload]
      };
    }
    case 'SET_FILTER_WEEKDAYS': {
      return {
          ...state,
          weekdays: action.payload
      };
    }
    case 'SET_FILTER_TIMEFRAMES': {
      return {
          ...state,
          timeframes: action.payload
      };
    }
    case 'ADD_TO_FILTER_ZONES': {
      // console.log('add item %s to zones filter %o', action.payload, state)
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
      // console.log('remove item %o from zones filter', action.payload)
      let zones = state.zones.split(",") || [];
      zones = zones.filter((item) => {return item.toString() !== action.payload.toString() });

      return {
          ...state,
          zones: zones.join(",")
      };
    }
    case 'CLEAR_FILTER_ZONES': {
      // console.log('clear zones filter')

      return {
          ...state,
          zones: ''
      };
    }
    case 'ADD_TO_FILTER_MARKERS_EXCLUDE': {
      let parkeerduurexclude = [];
      try {
        // console.log('add item %s to parkeerduurexclude filter %o', action.payload, state)
        if(state.parkeerduurexclude) {
          try {
            parkeerduurexclude = state.parkeerduurexclude.split(",") || []
          } catch(ex) {
            parkeerduurexclude = [];
          }
        }
        if(!parkeerduurexclude.includes(action.payload)) {
          parkeerduurexclude.push(action.payload);
        }
      } catch(ex) {
        parkeerduurexclude = [];
      }

      return {
        ...state,
        parkeerduurexclude: parkeerduurexclude.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_MARKERS_EXCLUDE': {
      // console.log('remove item %o from parkeerduurexclude filter', action.payload)
      let parkeerduurexclude = [];
      try {
        parkeerduurexclude = state.parkeerduurexclude.split(",") || [];
        parkeerduurexclude = parkeerduurexclude.filter((item) => {return item.toString() !== action.payload.toString() });
      } catch(ex) {
        parkeerduurexclude = [];
      }

      return {
          ...state,
          parkeerduurexclude: parkeerduurexclude.join(",")
      };
    }
    case 'CLEAR_FILTER_MARKERS_EXCLUDE': {
      // console.log('clear parkeerduurexclude filter')

      return {
          ...state,
          parkeerduurexclude: ''
      };
    }
    case 'ADD_TO_FILTER_AFSTAND_EXCLUDE': {
      let afstandexclude = [];
      try {
        // console.log('add item %s to afstandexclude filter %o', action.payload, state)
        if(state.afstandexclude) {
          try {
            afstandexclude = state.afstandexclude.split(",") || []
          } catch(ex) {
            afstandexclude = [];
          }
        }
        if(!afstandexclude.includes(action.payload)) {
          afstandexclude.push(action.payload);
        }
      } catch(ex) {
        afstandexclude = [];
      }

      return {
        ...state,
        afstandexclude: afstandexclude.join(",")
      };
    }
    case 'REMOVE_FROM_FILTER_AFSTAND_EXCLUDE': {
      // console.log('remove item %o from afstandexclude filter', action.payload)
      let afstandexclude = [];
      try {
        afstandexclude = state.afstandexclude.split(",") || [];
        afstandexclude = afstandexclude.filter((item) => {return item.toString() !== action.payload.toString() });
      } catch(ex) {
        afstandexclude = [];
      }

      return {
          ...state,
          afstandexclude: afstandexclude.join(",")
      };
    }
    case 'CLEAR_FILTER_AFSTAND_EXCLUDE': {
      // console.log('clear afstandexclude filter')

      return {
          ...state,
          afstandexclude: ''
      };
    }
    case 'ADD_TO_FILTER_VOERTUIGTYPES_EXCLUDE': {
      let voertuigtypesexclude = [];
      try {
        // console.log('add item %s to voertuigtypesexclude filter %o', action.payload, state)
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
      // console.log('remove item %o from voertuigtypesexclude filter', action.payload)
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
      // console.log('clear voertuigtypesexclude filter')

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
      // console.log('remove item %s from aanbiedersexclude filter', action.payload)
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
      // console.log('clear aanbiedersexclude filter')
    
      return {
          ...state,
          aanbiedersexclude: ''
      };
    }
    case 'SET_FILTER_ONTWIKKELING_VANTOT': {
      // console.log('reducer filter set datum ontwikkeling van %s to %s', action.payload.van, action.payload.tot)
      return {
          ...state,
          ontwikkelingvan: action.payload.van,
          ontwikkelingtot: action.payload.tot
      };
    }
    case 'SET_FILTER_ONTWIKKELING_AGGREGATIE': {
      // console.log('reducer filter set aggregatie ontwikkeling %s', action.payload)
      return {
          ...state,
          ontwikkelingaggregatie: action.payload
      };
    }
    case 'SET_FILTER_ONTWIKKELING_AGGREGATIE_TIJD': {
      return {
          ...state,
          ontwikkelingaggregatie_tijd: action.payload
      };
    }
    case 'SET_FILTER_ONTWIKKELING_AGGREGATIE_FUNCTION': {
      return {
          ...state,
          ontwikkelingaggregatie_function: action.payload
      };
    }
    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('login/logout - reset filter')
      return initialState;
    }
    case 'RESET_FILTER': {
      // console.log('reset filter')
      
      return initialState;
    }
    case 'IMPORT_STATE': {
      // console.log('import filter', action.payload.filter)
      return {
        ...state,
        ...action.payload.filter
      }
    }
    default:
      return state;
  }
}
