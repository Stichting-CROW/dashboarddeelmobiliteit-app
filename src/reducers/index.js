import { combineReducers } from 'redux';
import last_update from './last_update';
import metadata from './metadata';
import vehicles from './vehicles';
import filter from './filter';
import authentication from './authentication';
import zones_geodata from './zones_geodata';

export default combineReducers({
  last_update,
  metadata,
  vehicles,
  filter,
  authentication,
  zones_geodata
})