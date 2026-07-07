import { isOperatorPrestatiesView } from './prestatiesAanbiedersViewMode';

export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

/** Organisation type from /menu/acl or /user/acl (not organisation records). */
export const getAclOrganisationType = (acl) => {
  if (!acl) return null;
  return acl.organisation_type ?? acl.type_of_organisation ?? null;
};

/**
 * Operator account: organisation_type OPERATOR, or — only when the
 * organisation type is unknown — a single operator in the menu ACL
 * (see prestatiesAanbiedersViewMode.isOperatorPrestatiesView).
 *
 * A known organisation type is authoritative: municipality and other
 * government accounts can be scoped to a single operator too (e.g. only one
 * provider active in their gebied), so the single-operator heuristic must not
 * override a known non-OPERATOR type.
 */
export const isOperatorAccount = (acl) => {
  if (!acl) return false;

  const organisationType = getAclOrganisationType(acl);
  if (organisationType) {
    return organisationType === 'OPERATOR';
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

/**
 * Whether the logged-in user should get the operator-restricted UI
 * (e.g. no HB matrix layer). Falls back to the single-operator heuristic on
 * `aclOperators` only when the ACL doesn't expose an organisation type.
 */
export const isOperatorUser = (acl, aclOperators = []) => {
  const organisationType = getAclOrganisationType(acl);
  if (organisationType) {
    return organisationType === 'OPERATOR';
  }
  return isOperatorAccount(acl) || isOperatorPrestatiesView(aclOperators);
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

// Maximum number of municipalities we still enumerate in a
// `/zones?municipalities=GM..,GM..` (or `/zones?zone_ids=..`) query. Above this,
// the upstream server rejects the request with a 502. Accounts with more
// accessible municipalities than this are treated NL-wide (like admins) for zone
// loading and zone-boundary display; their vehicles are scoped by the auth token
// regardless (see createFilterparameters). Kept well below any realistic
// province-sized list so that small/regional accounts keep their precise zones.
export const MAX_ENUMERABLE_MUNICIPALITIES = 25;

// True when we should treat this account as NL-wide for zone loading/display:
// admins, or non-admin organisations with access to so many municipalities that
// enumerating them in a zones query would 502.
export const shouldTreatMunicipalitiesAsNlWide = (state) => {
  if (isAdmin(state)) return true;
  const gebieden = state?.metadata?.gebieden || [];
  return gebieden.length > MAX_ENUMERABLE_MUNICIPALITIES;
};

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
