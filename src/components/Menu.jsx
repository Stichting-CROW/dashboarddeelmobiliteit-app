import React from 'react';
import { Link } from "react-router-dom";
import { clearUser } from '../actions/authentication';
import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';

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

  return (
      <ul className="flex">
        <li className="mr-6"><Link className="text-blue-500 hover:text-blue-800" to="/">Home</Link></li>
        <li className="mr-6"><Link className="text-blue-500 hover:text-blue-800" to="/demo">Demo</Link></li>
        {(isLoggedIn) ?
          <li className="mr-6"><Link className="text-blue-500 hover:text-blue-800" onClick={logOut} to="/">Log uit</Link></li>
          :
          <li className="mr-6"><Link className="text-blue-500 hover:text-blue-800" to="/login">Log in</Link></li>
        }
      </ul>
  )
  // <nav class="flex items-center justify-around flex-wrap bg-teal-500 p-6">
  // </nav>
}

export default Menu;

