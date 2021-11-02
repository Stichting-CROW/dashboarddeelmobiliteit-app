import { combineReducers } from 'redux';
import metadata from './metadata';
import vehicles from './vehicles';
import filter from './filter';
import authentication from './authentication';
import zones_geodata from './zones_geodata';

export default combineReducers({
  metadata,
  vehicles,
  filter,
  authentication,
  zones_geodata
})