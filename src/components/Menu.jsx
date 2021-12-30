import React, { useState } from 'react';
// import moment from 'moment';
import { Link, useLocation } from "react-router-dom";

import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { IconButtonFilter } from './IconButtons.jsx';
import { clearUser } from '../actions/authentication.js';

function MenuItem(props) {
  const [pathName, setPathName] = useState(document.location.pathname);

  const isActive = pathName === props.path;
  const icon = (isActive ? props.icon.replace('.png', '-active.png') : props.icon);

  // Log pathname on navigate
  // https://v5.reactrouter.com/web/api/Hooks
  let location = useLocation();
  React.useEffect(() => {
    setPathName(document.location ? document.location.pathname : null);
  }, [location]);

  return (
    <>
      {props.path && <Link className={`
          text-menu
          ${isActive ? 'is-active' : ''}
        `}
        to={props.path}
        href={props.href}
        onClick={props.onClick}
        >
        {icon ? <img src={icon} /> : ''}
        <span className={`${(isActive || ! icon) ? 'inline-block' : 'hidden'} sm:inline-block  ml-2`}>
          {props.text}
        </span>
      </Link>}

      {! props.path && <a className={`
          text-menu
          inline-block cursor-pointer
          ${isActive ? 'is-active' : ''}
        `}
        href={props.href}
        onClick={props.onClick}
        >
        {icon ? <img src={icon} /> : ''}
        <span className={`${(isActive || ! icon) ? 'inline-block' : 'hidden'} sm:inline-block  ml-2`}>
          {props.text}
        </span>
      </a>}
    </>
  )
}

function SubMenuItem(props) {
  return <>
    {props.path && <Link className={`text-link`}
      to={props.path}
      href={props.href}
      onClick={props.onClick}
      >
      <span className={`block`}>
        {props.text}
      </span>
    </Link>}

    {! props.path && <a className={`text-link inline-block cursor-pointer`}
      href={props.href}
      onClick={props.onClick}
      >
      <span className={`block`}>
        {props.text}
      </span>
    </a>}
  </>
}

function Menu() {
  const [pathName, setPathName] = useState(document.location.pathname);
  const [subMenuIsActive, setSubMenuIsActive] = useState(false);

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

  return (
    <div className="
      Menu
      fixed
      w-full
      mx-0
      bottom-0
      bg-white
      sm:bg-transparent
      sm:bottom-0.5
      sm:mx-8
      sm:w-auto
    ">
      <div className="
        Menu-inner
        px-4
        mx-auto
        bg-white
        box-border
        w-full
        flex
        flex-col
        justify-center
        sm:shadow-lg
        sm:m-4
        sm:mb-1
        sm:rounded-3xl
      ">

        <div className="
          whitespace-nowrap
        ">

          {isLoggedIn && <>
            <MenuItem
              text={'Aanbod'}
              path={'/map/park'}
              icon={'/images/components/Menu/icon-aanbod.png'}
            />

            <MenuItem
              text={'Verhuringen'}
              path={'/map/rentals'}
              icon={'/images/components/Menu/icon-verhuringen.png'}
            />

            <MenuItem
              text={'Ontwikkeling'}
              href={'/stats/overview'}
              icon={'/images/components/Menu/icon-ontwikkeling.png'}
            />

            <MenuItem
              text={'...'}
              onClick={(e) => {
                e.preventDefault();
                setSubMenuIsActive(! subMenuIsActive)
              }}
            />

          </>}
          
          {! isLoggedIn && <>
            <Link className="text-menu" to="/login">
              Log in
            </Link>
          </>}

          {isLoggedIn && false && <Link className={`
            text-menu
            ${pathName === '/monitoring' ? 'is-active' : ''}
          `} to="/monitoring">
            Monitor
          </Link>}

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

        {subMenuIsActive && <>
          <div className="
            Menu-subMenu
            absolute
          ">
            <SubMenuItem
              text={'Log uit'}
              onClick={(e) => {
                e.preventDefault();
                setSubMenuIsActive(! subMenuIsActive)
                logOut();
              }}
            />
            <SubMenuItem
              text={'Feedback 📨'}
              href="mailto:info@deelfietsdashboard.nl?subject=Feedback Dashboard Deelmobiliteit&body=Ik heb feedback: "
              onClick={(e) => {
                setSubMenuIsActive(! subMenuIsActive);
              }}
            />
          </div>
        </>}

      </div>
    </div>
  )

  // <nav class="flex items-center justify-around flex-wrap bg-teal-500 p-6">
  // </nav>
}

export default Menu;

