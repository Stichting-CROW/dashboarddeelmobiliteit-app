import { combineReducers } from 'redux';
import created from './created';
import last_update from './last_update';
import metadata from './metadata';
import vehicles from './vehicles';
import rentals from './rentals';
import filter from './filter';
import authentication from './authentication';
import zones_geodata from './zones_geodata';
import layers from './layers';
import ui from './ui';
import statsreducer from './statsreducer';

export default combineReducers({
  created,
  last_update,
  metadata,
  vehicles,
  rentals,
  filter,
  authentication,
  zones_geodata,
  layers,
  ui,
  statsreducer
})