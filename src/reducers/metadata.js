const md5 = require('md5');

const initialState = {
  aanbieders: [],
  gebieden: [],
  zones: [],
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case 'SET_AANBIEDERS': {
      let current = state.aanbieders ? state.aanbieders: [];
      
      if(md5(current)===md5(action.payload)) { return state; }
      
      return {
        ...state,
        aanbieders: action.payload
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

    default:
      return state;
  }
}
