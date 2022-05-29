import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from "react-router-dom";

import './MenuSecondaryItem.css';
// import { IconButtonFilter } from './IconButtons.jsx';
// import { clearUser } from '../actions/authentication';

function MenuSecondaryItem(props) {
  return (
    <a
      href="goForIt"
      className="MenuSecondaryItem cursor-pointer mx-2"
      onClick={props.onClick}
    >
      {props.text}
    </a>
  )
}

function MenuSecondary() {
  const dispatch = useDispatch()

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

  return (
    <div className="MenuSecondary block sm:hidden absolute left-0 z-10">
      <MenuSecondaryItem
        text="Filters"
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

