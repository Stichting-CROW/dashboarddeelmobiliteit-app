import { combineReducers } from 'redux';
import vehicles from './vehicles';
import filter from './filter';
import authentication from './authentication';

export default combineReducers({
  vehicles,
  filter,
  authentication
})
