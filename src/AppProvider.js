import React, { Component } from 'react';
// import { bindActionCreators } from 'redux';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from 'redux';
import { connect } from 'react-redux';

import moment from 'moment';
import thunk from 'redux-thunk';

import appReducer from './reducers';
import App from './App';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const md5 = require('md5');

// Get persistentState from localStorage
const theState = localStorage.getItem('CROWDD_reduxState')
const persistedState = theState ? JSON.parse(theState) : {};

export const store = createStore(
  appReducer,
  persistedState,
  composeEnhancers(applyMiddleware(thunk)),
);

// Store Redux state into localStorage
store.subscribe(() => {
  const storeState = store.getState();

  const oldFilterHash = localStorage.getItem('CROWDD_filterhash') || false;
  const newFilterHash = md5(JSON.stringify(storeState.filter))
  if(newFilterHash!==oldFilterHash) {
    // console.log("filter changed - invalidate data and zones here!");
    localStorage.setItem('CROWDD_filterhash', newFilterHash)
    
    store.dispatch({ type: 'CLEAR_ZONES', payload: null});
    store.dispatch({ type: 'CLEAR_VEHICLES', payload: null});
  }
  
  const storeStateToSaveInLocalStorage = {
    last_update: moment().unix(),
    authentication: storeState.authentication,
    filter: storeState.filter,
    layers: storeState.layers
  }
  localStorage.setItem('CROWDD_reduxState', JSON.stringify(storeStateToSaveInLocalStorage))
})

class AppProvider extends Component {
  render() {
    return (
      <Provider store={store}>
        <App content={this.props.content} />
      </Provider>
    )
  }
}

function connectWithStore(store, WrappedComponent, ...args) {
  let ConnectedWrappedComponent = connect(...args)(WrappedComponent)
  return function (props) {
    return <ConnectedWrappedComponent {...props} store={store} />
  }
}

function mapStateToProps(state) {
  return {
    // config: getConfig(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    // actions: bindActionCreators(actions, dispatch),
  }
}

export default AppProvider = connectWithStore(
  store,
  AppProvider,
  mapStateToProps,
  mapDispatchToProps
)
