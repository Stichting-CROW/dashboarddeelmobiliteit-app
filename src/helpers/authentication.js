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
