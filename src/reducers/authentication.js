const initialState = {
    user_data: null
}
  
export default function vehicles(state = initialState, action) {
    switch(action.type) {
        case 'SET_USER': {
            const user = action.payload
            return {
                user_data: user
            }
        }
        case 'CLEAR_USER': {
            return { user_data: null }
        }
        default:
            return state;
    }
}