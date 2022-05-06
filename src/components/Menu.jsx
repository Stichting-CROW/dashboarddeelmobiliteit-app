
import React, { useState } from 'react';
// import moment from 'moment';
import { Link } from "react-router-dom";

import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../actions/authentication.js';

// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and Internet Explorer 10+.
// Internet Explorer: The clipboard feature may be disabled by
// an administrator. By default a prompt is shown the first
// time the clipboard is used (per session).
//
// https://stackoverflow.com/a/33928558
function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", text);

    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        }
        catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return prompt("Copy to clipboard: Ctrl+C, Enter", text);
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
}

function MenuItem(props) {

  const pathName = props.pathName;
  const isActive = pathName === props.path || pathName === props.href || (pathName === '/' && props.path === '/map/park');
  const icon = (isActive ? props.icon.replace('.svg', '-active.svg') : props.icon);

  return (
    <>
      {props.path && <Link className={`
          text-menu
          text-center
          ${isActive ? 'is-active' : ''}
        `}
        to={props.path}
        href={props.href}
        onClick={props.onClick}
        title={props.title}
        >
        {icon ? <img alt={props.text} src={icon} /> : ''}
        {props.text && <span className={`${(isActive || ! icon) ? 'inline-block' : 'hidden'} sm:inline-block  ml-2`}>
          {props.text}
        </span>}
      </Link>}

      {! props.path && <a className={`
          text-menu
          text-center
          inline-block cursor-pointer
          ${isActive ? 'is-active' : ''}
        `}
        href={props.href}
        onClick={props.onClick}
        title={props.title}
        >
        {icon ? <img alt={props.text} src={icon} /> : ''}
        {props.text && <span className={`${(isActive || ! icon) ? 'inline-block' : 'hidden'} sm:inline-block  ml-2`}>
          {props.text}
        </span>}
      </a>}
    </>
  )
}

function SubMenuItem(props) {
  const [showMessage, setShowMessage] = useState(false)
  
  const onClick = (e) => {
    console.log('show message')
    setShowMessage(true);
    
    setTimeout(() => { console.log('hide message'); setShowMessage(false) }, 3000);
    
    props.onClick(e);
  }
  
  return <>
    {props.path && <Link className={`text-link`}
      to={props.path}
      href={props.href}
      onClick={props.onClick}
      >
      <span className={`block`}>
        {showMessage ? props.message : props.text}
      </span>
    </Link>}

    {! props.path && <a className={`text-link inline-block cursor-pointer`}
      href={props.href}
      onClick={onClick}
      >
      <span className={`block`}>
        {showMessage ? props.message : props.text}
      </span>
    </a>}
  </>
}

function Menu({pathName}) {
  const [subMenuIsActive, setSubMenuIsActive] = useState(false);

  const dispatch = useDispatch();
  // let dateToShow = moment(moment().format('2021-11-06 06:00'));
  
  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  const exportState = useSelector(state => {
    return { filter: state.filter, layers: state.layers, ui:state.ui };
  });
  
  const logOut = () => {
    try {
      if (isLoggedIn) {
        dispatch( clearUser() );
        dispatch( { type: "LOGOUT", payload: null });
      }
    } catch(ex) {
      console.error("Menu.logout - error ", ex);
    }
  }
  
  const exportStateToClipboard = () => {
    // creates a url that recreates the exact view
    const l = window.location;
    const base = l.protocol + "//" + l.host + l.pathname;
    const params = encodeURIComponent(JSON.stringify(exportState));
    const url = base + "?view=" + params;

    copyToClipboard(url);
    // navigator.clipboard.writeText(url);
    window.notify('Link gekopieerd. Gebruik de link om direct naar deze weergave van de kaart te verwijzen.')
  }
  
  let menuClassName = "Menu fixed w-full mx-0 bottom-0 bg-white";
  menuClassName += " sm:bg-transparent sm:w-full";
  if(exportState && exportState.ui && exportState.ui.FILTERBAR) {
    menuClassName += ' filter-open';
  }
  
  return (
    <div className={menuClassName}>
      <div className="
        Menu-inner
        px-0
        mx-auto
        bg-white
        box-border
        w-full
        flex
        flex-col
        justify-center
        sm:px-4
        sm:shadow-lg
        sm:m-4
        sm:mb-1
        sm:rounded-3xl
      ">

        <div className="
          whitespace-nowrap
          text-center
        ">

          {isLoggedIn && <>
            <MenuItem
              pathName={pathName}
              text={'Aanbod'}
              path={'/map/park'}
              icon={'/images/components/Menu/aanbod.svg'}
            />

            <MenuItem
              pathName={pathName}
              text={'Verhuringen'}
              path={'/map/rentals'}
              icon={'/images/components/Menu/verhuringen.svg'}
            />

            <MenuItem
              pathName={pathName}
              text={'Ontwikkeling'}
              path={'/stats/overview'}
              icon={'/images/components/Menu/ontwikkeling.svg'}
            />

            <MenuItem
              pathName={pathName}
              text={'Zones'}
              path={'/map/zones'}
              icon={'https://i.imgur.com/GrF8KBA.png'}
            />

            <MenuItem
              title="Kopieer link"
              text={''}
              icon={'/images/components/Menu/share.svg'}
              onClick={(e) => {
                e.preventDefault();
                exportStateToClipboard();
              }}
            />

            <MenuItem
              pathName={pathName}
              path={'/misc'}
              text={''}
              icon={'/images/components/Menu/settings.svg'}
            />

          </>}
          
          {! isLoggedIn && <>
            <Link className="text-menu" to="/login">
              Log in
            </Link>
            <Link className="text-menu" to="/over">
              Over
            </Link>
            <Link className="text-menu" to="/rondleiding">
              Rondleiding
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
              text={'Exporteer aanzicht'}
              message={'Aanzicht gekopieerd'}
              onClick={(e) => {
                exportStateToClipboard();
              }}
            >
              <span>Tekst hier</span>
            </SubMenuItem>
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

