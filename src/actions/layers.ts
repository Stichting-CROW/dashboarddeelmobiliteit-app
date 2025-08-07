import { LAYER_SET_MAP_STYLE } from "./actionTypes";

export const setMapStyle = (name: string) => ({
  type: LAYER_SET_MAP_STYLE,
  payload: name
})

// Data layer actions
export const setDataLayer = (displayMode: string, layerName: string) => ({
  type: 'LAYER_SET_DATA_LAYER',
  payload: { displayMode, layerName }
})

export const setSingleDataLayer = (displayMode: string, layerName: string) => ({
  type: 'LAYER_SET_SINGLE_DATA_LAYER',
  payload: { displayMode, layerName }
})

export const unsetDataLayer = (displayMode: string, layerName: string) => ({
  type: 'LAYER_UNSET_DATA_LAYER',
  payload: { displayMode, layerName }
})

export const toggleDataLayer = (displayMode: string, layerName: string, isVisible: boolean) => ({
  type: 'LAYER_TOGGLE_DATA_LAYER',
  payload: { displayMode, layerName, isVisible }
})

export const setActiveDataLayers = (displayMode: string, layerNames: string[]) => ({
  type: 'LAYER_SET_ACTIVE_DATA_LAYERS',
  payload: { displayMode, layerNames }
})
