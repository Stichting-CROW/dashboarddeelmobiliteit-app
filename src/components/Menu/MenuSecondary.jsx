import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from "react-router-dom";

import {StateType} from '../../types/StateType';

import './MenuSecondaryItem.css';

function MenuSecondaryItem(props) {
  return (
    <a
      href="goForIt"
      className="MenuSecondaryItem cursor-pointer mx-1"
      onClick={props.onClick}
    >
      {props.text}
    </a>
  )
}

function MenuSecondary() {
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
    <div className="MenuSecondary block sm:hidden absolute left-0 z-10">
      {displayMode !== 'displaymode-other' && <MenuSecondaryItem
        text="🕓"
        onClick={(e) => {
          e.preventDefault();
          setFilterDatum(new Date())
        }}
      />}
      <MenuSecondaryItem
        text={displayMode.indexOf('displaymode-zones-') > -1 ? 'Opties' : 'Filters'}
        onClick={(e) => {
          e.preventDefault();
          setVisibility('FILTERBAR', true)
        }}
      />
      {pathName !== '/stats/overview' && <MenuSecondaryItem
        text="Lagen"
        onClick={(e) => {
          e.preventDefault();
          setVisibility('MenuSecondary.layers', true)
        }}
      />}
      {/*
      <MenuSecondaryItem
        text="Info"
        onClick={() => {
          setVisibility('METASTATS', true)
        }}
      />
    */}
    </div>
  )
}

export default MenuSecondary;

