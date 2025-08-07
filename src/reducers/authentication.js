import { SET_USER, CLEAR_USER, SET_ACL_IN_REDUX, MARK_FEATURE_AS_SEEN, SET_LATEST_SEEN_VERSION } from '../actions/actionTypes.js';

const initialState = {
  user_data: null,
  seenFeatures: {},
  latestSeenVersion: null
}
  
export default function authentication(state = initialState, action) {
    // Ensure state has the required properties even if loaded from localStorage
    const currentState = {
      ...initialState,
      ...state
    };

    switch(action.type) {
        case 'SET_USER': {
            const user = action.payload
            return {
                ...currentState,
                user_data: user
            }
        }
        case 'CLEAR_USER': {
            return {
                ...currentState,
                user_data: null
            }
        }
        case 'SET_ACL_IN_REDUX': {
            return {
                ...currentState,
                user_data: {
                    ...currentState.user_data,
                    acl: action.payload
                }
            }
        }
        case MARK_FEATURE_AS_SEEN: {
            const featureId = action.payload;
            return {
                ...currentState,
                seenFeatures: {
                    ...currentState.seenFeatures,
                    [featureId]: true
                }
            }
        }
        case SET_LATEST_SEEN_VERSION: {
            const version = action.payload;
            return {
                ...currentState,
                latestSeenVersion: version
            }
        }
        default:
            return currentState;
    }
}
