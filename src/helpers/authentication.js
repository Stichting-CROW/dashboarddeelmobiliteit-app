export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

export const canEditHubs = (acl) => {
  if(! acl) return false;

  const allowedRoles = [
    'MICROHUB_EDIT'
  ];

  let canEdit = false;
  acl.privileges?.forEach((role) => {
    if(allowedRoles.indexOf(role) > -1) {
      canEdit = true;
    }
  });

  return canEdit;
}

// Checks if user is admin
export const isAdmin = (state) => {
  if(! state) return;
  if(! state.authentication) return;
  if(! state.authentication.user_data?.user?.registrations) return;

  let admin = false;
  state.authentication.user_data.user.registrations.forEach(x => {
    if(x.roles.includes('admin')) {
      admin = true;
    }
  });

  return admin;
}

// Validate if the current authentication state is valid
export const isValidAuthState = (state) => {
  if (!state || !state.authentication || !state.authentication.user_data) {
    return false;
  }

  const userData = state.authentication.user_data;
  
  // Check if token exists
  if (!userData.token) {
    return false;
  }

  // Optional: Add token expiration check if your API provides expiration info
  // if (userData.token_expires && new Date(userData.token_expires) < new Date()) {
  //   return false;
  // }

  return true;
};

// Clear invalid authentication state
export const clearInvalidAuthState = (dispatch) => {
  dispatch({ type: 'CLEAR_USER' });
  
  // Clear any cached data that depends on authentication
  dispatch({ type: 'CLEAR_VEHICLES', payload: null });
  dispatch({ type: 'CLEAR_RENTALS_ORIGINS', payload: null });
  dispatch({ type: 'CLEAR_RENTALS_DESTINATIONS', payload: null });
  
  // Reset metadata to force reload with public data
  dispatch({ type: 'SET_METADATA_LOADED', payload: false });
};
