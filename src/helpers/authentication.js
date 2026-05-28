export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

/** Organisation type from /menu/acl or /user/acl (not organisation records). */
export const getAclOrganisationType = (acl) => {
  if (!acl) return null;
  return acl.organisation_type ?? acl.type_of_organisation ?? null;
};

/**
 * Operator account: organisation_type OPERATOR, or a single operator in menu ACL
 * (see prestatiesAanbiedersViewMode.isOperatorPrestatiesView).
 */
export const isOperatorAccount = (acl) => {
  if (!acl) return false;

  if (getAclOrganisationType(acl) === 'OPERATOR') {
    return true;
  }

  const operators = acl.operators;
  if (
    Array.isArray(operators)
    && operators.length === 1
    && operators[0]?.system_id
    && !acl.is_admin
  ) {
    return true;
  }

  return false;
};

export const canEditHubs = (acl) => {
  if (!acl) return false;

  // OPERATOR organisations are never allowed to edit zones,
  // even if they happen to have the MICROHUB_EDIT privilege.
  // Editing is restricted to MUNICIPALITY, OTHER_GOVERNMENT and ADMIN
  // (see EditUser.tsx -> org_types_allowed_to_edit_zones).
  if (isOperatorAccount(acl)) {
    return false;
  }

  const allowedRoles = ['MICROHUB_EDIT'];

  const hasEditPrivilege = Array.isArray(acl.privileges)
    && acl.privileges.some((role) => allowedRoles.indexOf(role) > -1);

  if (!hasEditPrivilege) {
    return false;
  }

  return true;
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
