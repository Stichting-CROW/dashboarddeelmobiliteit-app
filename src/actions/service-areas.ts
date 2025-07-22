import {
  TOGGLE_SERVICE_AREA_FOR_OPERATOR,
  SHOW_SERVICE_AREA_FOR_OPERATOR
} from "./actionTypes";

export const toggleServiceAreaForOperator = (operator) => ({
  type: TOGGLE_SERVICE_AREA_FOR_OPERATOR,
  payload: operator
})

export const showServiceAreaForOperator = (operator) => ({
  type: SHOW_SERVICE_AREA_FOR_OPERATOR,
  payload: operator
})
