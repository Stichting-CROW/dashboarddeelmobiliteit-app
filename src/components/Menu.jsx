import React, { useState } from 'react';
// import moment from 'moment';
import { Link, useLocation } from "react-router-dom";

import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { IconButtonFilter } from './IconButtons.jsx';
import { clearUser } from '../actions/authentication';

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

  const extent = useSelector(state => {
    return state.layers ? state.layers.extent : [];
  });

  const toggleFilter = e => {
    dispatch({
      type: 'SET_FILTER_VISIBLE',
      payload: !showfilter
    })
  }

  const logOut = () => {
    if (isLoggedIn) {
      dispatch( clearUser() );
    }
  }

  // Log pathname on navigate
  // https://v5.reactrouter.com/web/api/Hooks
  let location = useLocation();
  React.useEffect(() => {
    setPathName(document.location.pathname);
  }, [location]);

  return (
    <div className="Menu fixed b-0">
      <div className="
        Menu-inner
        px-4
        py-3
        m-4
        mb-1
        mx-auto
        bg-white
        box-border
        rounded-3xl
        shadow-lg
        w-full
        flex
        flex-col
        justify-center
      ">

        <div className="flex">

          {isLoggedIn && <>
            <Link className={`
              text-menu
              has-icon
              icon-aanbod
              ${pathName === '/' || pathName === '/map/park' ? 'is-active' : ''}
            `} to="/map/park">
              Aanbod
            </Link>

            {/*
            <Link className={`
              text-menu
              has-icon
              icon-ontwikkeling
              ${pathName === '/map/trip' ? 'is-active' : ''}
            `} to="/map/trip">
              Verhuringen
            </Link>
            */}

            <Link className={`
                text-menu
                has-icon
                icon-ontwikkeling
                ${pathName === '/stats/overview' ? 'is-active' : ''}
              `} to="/stats/overview">
              Ontwikkeling
            </Link>
          </>}

          {isLoggedIn && false ?
              <div className="text-menu">
                <IconButtonFilter  onClick={toggleFilter} />
              </div>
              :
              null }

          {isLoggedIn && false && <Link className={`text-menu
              ${pathName === '/monitoring' ? 'is-active' : ''}`} to="/monitoring">
            Monitor
          </Link>}
          
          {isLoggedIn && false && <span>{JSON.stringify(extent)}</span>}

          {isLoggedIn
            ? <Link className="text-menu" onClick={logOut} to="/">
                Log uit
              </Link>
            : <Link className="text-menu" to="/login">
                Log in
              </Link>
          }

          {isLoggedIn
            && <a className="text-menu
              cursor-pointer" href="mailto:info@deelfietsdashboard.nl?subject=Feedback Dashboard Deelmobiliteit&body=Ik heb feedback: ">
                Feedback 📨
              </a>}

          {/*
          <Link to="/" className={`text-menu ${pathName === '' ? 'is-active' : ''}`} onClick={(e) => {
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
          </Link>
          */}

        </div>

      </div>
    </div>
  )

  // <nav class="flex items-center justify-around flex-wrap bg-teal-500 p-6">
  // </nav>
}

export default Menu;

