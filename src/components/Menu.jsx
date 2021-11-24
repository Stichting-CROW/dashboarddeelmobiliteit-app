import React, { useState } from 'react';
// import moment from 'moment';
import { Link, useLocation } from "react-router-dom";

import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { IconButtonFilter } from './IconButtons.jsx';

function Menu() {
  const [pathName, setPathName] = useState(document.location.pathname);
  const dispatch = useDispatch();
  // let dateToShow = moment(moment().format('2021-11-06 06:00'));

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  //Get the value of a State variable, and store it to a const, to use it later
  const showfilter = useSelector(state => {
    return state.filter ? state.filter.visible : false;
  });

  const gebieden = useSelector(state => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  const zones = useSelector(state => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  const toggleFilter = e => {
    dispatch({
      type: 'SET_FILTER_VISIBLE',
      payload: !showfilter
    })
  }

  const calculateBounds = e => {
    dispatch({
      type: 'CALCULATE_BOUNDS',
      payload: { gebieden, zones }
    })
  }

  // Log pathname on navigate
  // https://v5.reactrouter.com/web/api/Hooks
  let location = useLocation();
  React.useEffect(() => {
    setPathName(document.location.pathname);
  }, [location]);

  return (
    <div className="Menu fixed b-0">
      <div className="Menu-inner px-4 py-3 flex m-4 mb-1 mx-auto bg-white box-border rounded-3xl w-full shadow-lg">
        <Link className={`text-menu ${pathName === '/' || pathName === '/map/park' ? 'is-active' : ''}`} to="/map/park">
          Parkeerdata
        </Link>

        {/*<Link className={`text-menu ${pathName === '/map/trip' ? 'is-active' : ''}`} to="/map/trip">
          Tripdata
        </Link>*/}

        {isLoggedIn ?
            <div className="text-menu">
              <IconButtonFilter  onClick={toggleFilter} />
            </div>
            :
            null }

        {isLoggedIn && false && <Link className={`text-menu ${pathName === '/monitoring' ? 'is-active' : ''}`} to="/monitoring">
          Monitor
        </Link>}
        
        {isLoggedIn ?
            <div className="text-menu">
              <IconButtonFilter  onClick={calculateBounds} />
            </div>
            :
            null }
        

        {/*<Link to="/" className={`text-menu ${pathName === '' ? 'is-active' : ''}`} onClick={(e) => {
          e.preventDefault();
          dispatch({
            type: 'SET_FILTER_DATUM',
            payload: dateToShow.toISOString()
          })
          clearInterval(TO_interval);
          TO_interval = setInterval(x => {
            dateToShow.add(30, 'minutes');
            dispatch({
              type: 'SET_FILTER_DATUM',
              payload: dateToShow.toISOString()
            })
          }, 1200);
          // Stop after 10 minutes
          setTimeout(x => {
            clearInterval(TO_interval);
          }, 60 * 1000 * 10);
        }}>
          ▶️
        </Link>*/}

      </div>
    </div>
  )

  // <nav class="flex items-center justify-around flex-wrap bg-teal-500 p-6">
  // </nav>
}

export default Menu;

