import React, { useState } from 'react';
// import moment from 'moment';
import { Link, useLocation } from "react-router-dom";

import './MenuSecondaryItem.css';
import { useDispatch, useSelector } from 'react-redux';
// import { IconButtonFilter } from './IconButtons.jsx';
// import { clearUser } from '../actions/authentication';

function MenuSecondaryItem(props) {
  return (
    <a className="MenuSecondaryItem mx-2">
      {props.text}
    </a>
  )
}

function MenuSecondary() {
  return (
    <div className="MenuSecondary w-full block sm:hidden absolute left-0">
      <MenuSecondaryItem text="Filters" />
      <MenuSecondaryItem text="Lagen" />
    </div>
  )
}

export default MenuSecondary;

