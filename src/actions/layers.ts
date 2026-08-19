import {
  LAYER_SET_MAP_STYLE,
  LAYER_SET_DATA_LAYER_ORDER,
  LAYER_TOGGLE_OVERLAY_LAYER,
  LAYER_SET_OVERLAY_PHASE
} from "./actionTypes";

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

export const setDataLayerOrder = (displayMode: string, order: string[]) => ({
  type: LAYER_SET_DATA_LAYER_ORDER,
  payload: { displayMode, order }
})

// Overlay layer actions (servicegebieden / hubs / verbodsgebieden)
export const toggleOverlayLayer = (displayMode: string, layerId: string) => ({
  type: LAYER_TOGGLE_OVERLAY_LAYER,
  payload: { displayMode, layerId }
})

export const setOverlayPhase = (layerId: string, phase: string) => ({
  type: LAYER_SET_OVERLAY_PHASE,
  payload: { layerId, phase }
})
