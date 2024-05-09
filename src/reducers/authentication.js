const initialState = {
  user_data: null
}
  
export default function authentication(state = initialState, action) {
    switch(action.type) {
        case 'SET_USER': {
            const user = action.payload
            return {
                ...state,
                user_data: user
            }
        }
        case 'CLEAR_USER': {
            return {
                ...state,
                user_data: null
            }
        }
        case 'SET_ACL_IN_REDUX': {
            return {
                ...state,
                user_data: {
                    ...state.user_data,
                    acl: action.payload
                }
            }
        }
        default:
            return state;
    }
}
