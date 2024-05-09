import { LAYER_SET_MAP_STYLE } from "./actionTypes";

export const setMapStyle = (name: string) => ({
  type: LAYER_SET_MAP_STYLE,
  payload: name
})
