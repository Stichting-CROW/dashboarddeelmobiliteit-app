import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import appReducer from '../reducers/index.js';

export default function configureStore(initialState) {
  return createStore(
    appReducer,
    initialState,
    applyMiddleware(thunk)
  );
}
