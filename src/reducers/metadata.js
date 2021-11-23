const md5 = require('md5');

const initialState = {
  aanbieders: [],
  gebieden: [],
  zones: [],
  vehicle_types: [],
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
      const aanbieders = action.payload.map((aanbieder,idx)=>{
        return Object.assign(aanbieder, {color: colors[idx]});
      })
      
      if(md5(current)===md5(aanbieders)) { return state; }
      
      return {
        ...state,
        aanbieders
      }
    }
    case 'SET_GEBIEDEN': {
      let current = state.gebieden ? state.gebieden: [];
    
      if(md5(current)===md5(action.payload)) { return state; }
    
      return {
        ...state,
        gebieden: action.payload,
      }
    }
    
    case 'SET_ZONES': {
      let current = state.zones ? state.zones: [];
    
      if(md5(current)===md5(action.payload)) { return state; }

      return {
          ...state,
          zones: action.payload,
      };
    }

    case 'SET_VEHICLE_TYPES': {
      let current = state.vehicle_types ? state.vehicle_types: [];
    
      if(md5(current)===md5(action.payload)) { return state; }

      return {
          ...state,
          vehicle_types: action.payload,
      };
    }

    default:
      return state;
  }
}
