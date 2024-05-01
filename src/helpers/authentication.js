export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

export const canEditHubs = (acl) => {
  return acl && acl.privileges?.indexOf('ORGANISATION_ADMIN') > -1
}
