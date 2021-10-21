import { SET_VEHICLES, SET_VEHICLE, CLEAR_VEHICLES } from "./actionTypes";

export const setVehicles = (vehicles) => ({
  type: SET_VEHICLES,
  payload: vehicles
})

export const setVehicle = (vehicle) => ({
  type: SET_VEHICLE,
  payload: vehicle
})

export const clearVehicles = () => ({
  type: CLEAR_VEHICLES,
  payload: null
})
