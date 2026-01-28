import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from "react-router-dom";

import {StateType} from '../../types/StateType';

import './FloatingMobileMenuItem.css';

function FloatingMobileMenuItem(props) {
  return (
    <a
      href="goForIt"
      className="FloatingMobileMenuItem cursor-pointer mx-1"
      onClick={props.onClick}
    >
      {props.text}
    </a>
  )
}

function FloatingMobileMenu() {
  const dispatch = useDispatch()

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : null;
  });

  // Our state variables
  const [pathName, setPathName] = useState(document.location.pathname);
  // const [uriParams, setUriParams] = useState(document.location.search);

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
    // setUriParams(location ? location.search : null);
  }, [location]);
  
  const setVisibility = (name, visibility) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    })
  }

  const setFilterDatum = (newdt) => {
    if(displayMode === 'displaymode-rentals') {
      dispatch({
        type: 'SET_FILTER_INTERVAL_END',
        payload: newdt.toISOString()
      })
      return;
    }
    dispatch({
      type: 'SET_FILTER_DATUM',
      payload: newdt.toISOString()
    })
  }

  return (
    <div className="FloatingMobileMenu block sm:hidden absolute left-0 z-10">
      {displayMode !== 'displaymode-other' && <FloatingMobileMenuItem
        text="🕓"
        onClick={(e) => {
          e.preventDefault();
          setFilterDatum(new Date())
        }}
      />}
      <FloatingMobileMenuItem
        text={displayMode && displayMode.indexOf('displaymode-zones-') > -1 ? 'Opties' : 'Filters'}
        onClick={(e) => {
          e.preventDefault();
          setVisibility('FILTERBAR', true)
        }}
      />
      {/*
      <FloatingMobileMenuItem
        text="Info"
        onClick={() => {
          setVisibility('METASTATS', true)
        }}
      />
    */}
    </div>
  )
}

export default FloatingMobileMenu;

