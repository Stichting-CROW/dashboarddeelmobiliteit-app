import {
  SET_SEARCH_BAR_QUERY
} from "./actionTypes";

export const setSearchBarQuery = (query) => ({
  type: SET_SEARCH_BAR_QUERY,
  payload: query
});
