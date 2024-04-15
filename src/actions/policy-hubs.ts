import {
  SET_ACTIVE_PHASE,
  TOGGLE_VISIBLE_LAYER,
  UNSET_VISIBLE_LAYER,
  SET_VISIBLE_LAYER,
  SET_SELECTED_POLICY_HUBS,
  SET_SHOW_COMMIT_FORM
} from "./actionTypes";

export const setActivePhase = (phase) => ({
  type: SET_ACTIVE_PHASE,
  payload: phase
})

export const toggleVisibleLayer = (layer) => ({
  type: TOGGLE_VISIBLE_LAYER,
  payload: layer
})
export const unsetVisibleLayer = (layer) => ({
  type: UNSET_VISIBLE_LAYER,
  payload: layer
})
export const setVisibleLayer = (layer) => ({
  type: SET_VISIBLE_LAYER,
  payload: layer
})
export const setSelectedPolicyHubs = (ids) => ({
  type: SET_SELECTED_POLICY_HUBS,
  payload: ids
})
export const setShowCommitForm = (boolValue) => ({
  type: SET_SHOW_COMMIT_FORM,
  payload: boolValue
})
