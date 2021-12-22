const md5 = require('md5');

const initialState = {
  aanbieders: [],
  gebieden: [],
  zones: [],
  vehicle_types: [],
  metadata_loaded: false,
  zones_loaded: false
}

// utility function that creates a color palette
// background: https://mika-s.github.io/javascript/colors/hsl/2017/12/05/generating-random-colors-in-javascript.html
const generateHslaColors = (amount) => {
  
  let colors = []
  let huedelta = Math.trunc(360 / (amount+1))
  let alpha = 1.0

  for (let i = 0; i < amount; i++) {
    let hue = i * huedelta
    let lightness = i % 2 === 0 ? 35 : 65;
    let saturation = i % 2 === 1 ? 40 : 60;
    colors.push(`hsla(${hue},${saturation}%,${lightness}%,${alpha})`)
  }

  return colors
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'SET_AANBIEDERS': {
      let current = state.aanbieders ? state.aanbieders: [];
      
      // add colors (will be supplied by the API later)
      const colors = generateHslaColors(action.payload.length)
      const providerColors = {
        'cykl': '#a5e067',
        'flickbike': '#fe431d',
        'mobike': '#ed5144',
        'donkey': '#ed5144',
        'htm': '#db291e',
        'jump': '#fd3e48',
        'gosharing': '#77b136',
        'check': '#8f3af8',
        'felyx': '#064627',
        'lime': '#1bd831',
        'baqme': '#4bdfbb',
        'cargoroo': '#ffcb34',
        'hely': '#fd645c'
      }
      const aanbieders = action.payload.map((aanbieder,idx)=>{
        const color = providerColors[aanbieder.system_id] ? providerColors[aanbieder.system_id] : colors[idx];
        return Object.assign(aanbieder, {color: color});
      })
      
      if(md5(JSON.stringify(current))===md5(JSON.stringify(aanbieders))) { return state; }
      
      return {
        ...state,
        aanbieders
      }
    }
    case 'SET_GEBIEDEN': {
      let current = state.gebieden ? state.gebieden: [];
    
      if(md5(JSON.stringify(current))===md5(JSON.stringify(action.payload))) { return state; }
    
      return {
        ...state,
        gebieden: action.payload,
      }
    }
    
    case 'SET_ZONES': {
      let current = state.zones ? state.zones: [];
    
      if(md5(JSON.stringify(current))===md5(JSON.stringify(action.payload))) { return state; }

      return {
          ...state,
          zones: action.payload,
      };
    }
    
    case 'CLEAR_ZONES': {
      return {
          ...state,
          zones: [],
          zones_loaded: false,
      };
    }

    case 'SET_VEHICLE_TYPES': {
      let current = state.vehicle_types ? state.vehicle_types: [];
    
      if(JSON.stringify(md5(current))===JSON.stringify(md5(action.payload))) { return state; }

      return {
          ...state,
          vehicle_types: action.payload,
      };
    }

    case 'SET_METADATA_LOADED': {
      return {
          ...state,
          metadata_loaded: action.payload,
      };
    }

    case 'SET_ZONES_LOADED': {
      return {
          ...state,
          zones_loaded: action.payload,
      };
    }
    
    default:
      return state;
  }
}
