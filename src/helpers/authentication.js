export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

export const canEditHubs = (acl) => {
  const allowedRoles = [
    'MICROHUB_EDIT',
    'ORGANISATION_ADMIN'
  ];
  return acl && acl.privileges?.indexOf('ORGANISATION_ADMIN') > -1;
}
