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
