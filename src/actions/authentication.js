import { SET_USER, CLEAR_USER, SET_ACL_IN_REDUX } from "./actionTypes";

export const setUser = (user) => ({
  type: SET_USER,
  payload: user
})

export const clearUser = () => ({
  type: CLEAR_USER,
  payload: null
})

export const setAclInRedux = (acl) => ({
  type: SET_ACL_IN_REDUX,
  payload: acl
});
