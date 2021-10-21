import React from 'react';
import { Link } from "react-router-dom";
import './Menu.css';

function Menu() {
  return (
      <ul className="flex">
        <li className="mr-6"><Link className="text-blue-500 hover:text-blue-800" to="/">Home</Link></li>
        <li className="mr-6"><Link className="text-blue-500 hover:text-blue-800" to="/demo">Demo</Link></li>
      </ul>
  )
  // <nav class="flex items-center justify-around flex-wrap bg-teal-500 p-6">
  // </nav>
}

export default Menu;

