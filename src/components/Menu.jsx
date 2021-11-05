import React from 'react';
import { Link } from "react-router-dom";
import { clearUser } from '../actions/authentication';
import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { IconButtonFilter } from './IconButtons.jsx';

function Menu() {
  const dispatch = useDispatch();

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

  return (
    <div className="box-border p-2 pb-0">
      <div className="flex bg-white rounded-lg w-full p-4">
        <Link className="text-menu" to="/">
          Home
        </Link>
        <Link className="text-menu" to="/map/park">
          Parkeerdata
        </Link>
        <Link className="text-menu" to="/map/trip">
          Tripdata
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

