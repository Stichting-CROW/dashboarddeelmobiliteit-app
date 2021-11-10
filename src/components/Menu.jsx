import React, { useState } from 'react';
import moment from 'moment';
import { Link, useLocation } from "react-router-dom";

import { clearUser } from '../actions/authentication';
import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { IconButtonFilter } from './IconButtons.jsx';

function Menu() {
  const [pathName, setPathName] = useState(document.location.pathname);
  const dispatch = useDispatch();
  let TO_interval, dateToShow = moment();

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  const logOut = () => {
    if (isLoggedIn) {
      dispatch( clearUser() );
    }
  }

  //Get the value of a State variable, and store it to a const, to use it later
  const showfilter = useSelector(state => {
    return state.filter ? state.filter.visible : false;
  });

  const toggleFilter = e => {
    dispatch({
      type: 'SET_FILTER_VISIBLE',
      payload: !showfilter
    })
  }

  // Log pathname on navigate
  // https://v5.reactrouter.com/web/api/Hooks
  let location = useLocation();
  React.useEffect(() => {
    setPathName(document.location.pathname);
  }, [location]);

  return (
    <div className="Menu w-full fixed b-0">
      <div className="Menu-inner px-4 py-3 flex m-4 mb-1 mx-auto bg-white box-border rounded-3xl w-full shadow-lg">
        <Link className={`text-menu ${pathName === '/' || pathName === '/map/park' ? 'is-active' : ''}`} to="/map/park">
          Parkeerdata
        </Link>
        <Link className={`text-menu ${pathName === '/map/trip' ? 'is-active' : ''}`} to="/map/trip">
          Tripdata
        </Link>
        <Link to="/" className={`text-menu ${pathName === '' ? 'is-active' : ''}`} onClick={(e) => {
          e.preventDefault();
          dispatch({
            type: 'SET_FILTER_DATUM',
            payload: dateToShow.toISOString()
          })
          clearInterval(TO_interval);
          TO_interval = setInterval(x => {
            dateToShow.subtract(1, 'hour');
            dispatch({
              type: 'SET_FILTER_DATUM',
              payload: dateToShow.toISOString()
            })
          }, 3000)
        }}>
          ▶️
        </Link>
        {isLoggedIn ?
            <div className="text-menu">
              <IconButtonFilter  onClick={toggleFilter} />
            </div>
            :
            null }
        {isLoggedIn
          ?
          <Link className="text-menu flex-grow text-right" onClick={logOut} to="/">
            Log uit
          </Link>
          :
          <Link className="text-menu flex-grow text-right" to="/login">
            Log in
          </Link>
        }
      </div>
    </div>
  )

  // <nav class="flex items-center justify-around flex-wrap bg-teal-500 p-6">
  // </nav>
}

export default Menu;

