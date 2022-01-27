export const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};
