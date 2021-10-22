import { combineReducers } from 'redux';
import vehicles from './vehicles';
import authentication from './authentication';

export default combineReducers({
  vehicles,
  authentication
})
