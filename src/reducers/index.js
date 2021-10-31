import { combineReducers } from 'redux';
import metadata from './metadata';
import vehicles from './vehicles';
import filter from './filter';
import authentication from './authentication';

export default combineReducers({
  metadata,
  vehicles,
  filter,
  authentication
})