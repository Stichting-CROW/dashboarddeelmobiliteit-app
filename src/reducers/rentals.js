// HB-matrix (origin/destination) loading status. Not persisted to
// localStorage (see AppProvider), so a reload never starts in 'loading'.
const initialHbState = {
  // 'idle' | 'loading' | 'success' | 'error'
  hb_status: 'idle',
  // Timestamp (ms) at which the current load started, or null
  hb_loading_since: null,
  // { total_trips, cells_with_trips, cell_count, selected_count, duration_ms }
  hb_result: null,
  // { message, http_status } or null
  hb_error: null,
  // Incremented by HB_RETRY to re-run the last HB request
  hb_retry_count: 0
}

const initialState = {
  origins: {},
  destinations: {},
  origins_operatorstats: [],
  destinations_operatorstats: [],
  ...initialHbState
}

export default function rentals(state = initialState, action) {
  switch(action.type) {
    case 'SET_HB_LOADING': {
      return Object.assign({}, state, {
        hb_status: 'loading',
        hb_loading_since: action.payload,
        hb_error: null
      })
    }
    case 'SET_HB_SUCCESS': {
      return Object.assign({}, state, {
        hb_status: 'success',
        hb_loading_since: null,
        hb_result: action.payload,
        hb_error: null
      })
    }
    case 'UPDATE_HB_RESULT': {
      // Merge new grid stats (e.g. after a viewport change) into the result
      if (state.hb_status !== 'success' || ! state.hb_result) return state;
      return Object.assign({}, state, {
        hb_result: Object.assign({}, state.hb_result, action.payload)
      })
    }
    case 'SET_HB_ERROR': {
      return Object.assign({}, state, {
        hb_status: 'error',
        hb_loading_since: null,
        hb_error: action.payload
      })
    }
    case 'RESET_HB_STATUS': {
      return Object.assign({}, state, initialHbState, {
        hb_retry_count: state.hb_retry_count
      })
    }
    case 'HB_RETRY': {
      return Object.assign({}, state, {
        hb_retry_count: (state.hb_retry_count || 0) + 1
      })
    }
    case 'SET_RENTALS_ORIGINS': {
      return Object.assign({}, state, {
        origins: action.payload,
        origins_operatorstats: []
      })
    }
    case 'SET_RENTALS_DESTINATIONS': {
      return Object.assign({}, state, {
        destinations: action.payload,
        destinations_operatorstats: []
      })
    }
    case 'CLEAR_RENTALS_ORIGINS': {
      return Object.assign({}, state, {
        origins: [],
        origins_operatorstats: []
      })
    }
    case 'CLEAR_RENTALS_DESTINATIONS': {
      return Object.assign({}, state, {
        destinations: [],
        destinations_operatorstats: []
      })
    }
    case 'LOGIN':
    case 'LOGOUT': {
      // console.log('login/logout - reset rentals data')      
      return initialState;
    }
    case 'SET_RENTALS_ORIGINS_OPERATORSTATS': {
      return Object.assign({}, state, {
        origins_operatorstats: action.payload
      })
    }
    case 'SET_RENTALS_DESTINATIONS_OPERATORSTATS': {
      return Object.assign({}, state, {
        destinations_operatorstats: action.payload
      })
    }
    default:
      return state;
  }
}
