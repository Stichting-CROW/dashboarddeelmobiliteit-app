import React, { useState } from 'react';
// import moment from 'moment';
import { Link } from "react-router-dom";
import {StateType} from '../types/StateType';


import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../actions/authentication.js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"

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
        {props.text && (
          isActive && props.text === 'Zones' ? (
            <>
              {props.text}
              <TooltipProvider delayDuration={500}>
                <Tooltip>
                  <TooltipTrigger>
                    <span className={`${(isActive || !icon) ? 'inline-block' : 'hidden'} sm:inline-block ml-1`}>
                      <InfoCircledIcon className="inline-block ml-1 h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top"
                    align="center"
                    className="max-w-[200px] text-sm whitespace-normal text-left p-2"
                  >
                    <p className="text-sm leading-tight">
                      <a 
                        target="_blank" 
                        rel="noopener noreferrer"
                        href="https://dashboarddeelmobiliteit.nl/docs/Beleidszones" 
                        className="no-underline text-theme-blue" 
                        style={{color: '#15AEEF'}}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Lees de documentatie
                      </a>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <span className={`${(isActive || !icon) ? 'inline-block' : 'hidden'} sm:inline-block ml-1`}>
              {props.text}
            </span>
          )
        )}
      </Link>}

      {!props.path && <a className={`
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
        {props.text && <span className={`${(isActive || !icon) ? 'inline-block' : 'hidden'} sm:inline-block ml-1`}>
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

function Menu({
  pathName, acl
}) {
  const [subMenuIsActive, setSubMenuIsActive] = useState(false);

  const dispatch = useDispatch();
  // let dateToShow = moment(moment().format('2021-11-06 06:00'));
  
  const userData = useSelector((state: StateType) => {
    return state.authentication.user_data;
  });
  
  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });
  
  const exportState = useSelector((state: StateType) => {
    return { filter: state.filter, layers: state.layers, ui:state.ui };
  });

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
        w-auto
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
              text={'Zones'}
              path={'/map/beleidshubs'}
              icon={'https://i.imgur.com/GrF8KBA.png'}
            />

            <MenuItem
              pathName={pathName}
              text={'Servicegebieden'}
              path={'/map/servicegebieden'}
              icon={'/images/components/Menu/ontwikkeling.svg'}
            />

            <MenuItem
              pathName={pathName}
              text={'Ontwikkeling'}
              path={'/stats/overview'}
              icon={'/images/components/Menu/ontwikkeling.svg'}
            />

            {/*<MenuItem
              title="Kopieer link"
              text={''}
              icon={'/images/components/Menu/share.svg'}
              onClick={(e) => {
                e.preventDefault();
                exportStateToClipboard();
              }}
            />*/}

            {(acl && (acl.is_admin || (acl.privileges && acl.privileges.indexOf('ORGANISATION_ADMIN') > -1))) && <MenuItem
              pathName={pathName}
              path={'/admin'}
              text={''}
              icon={'/images/components/Menu/admin.svg'}
            />}

            <MenuItem
              pathName={pathName}
              path={'/profile'}
              text={''}
              icon={'/images/components/Menu/settings.svg'}
            />

          </>}
          
          {! isLoggedIn && <>
            <MenuItem
              pathName={pathName}
              text={'Aanbod'}
              path={'/map/park'}
              icon={'/images/components/Menu/aanbod.svg'}
            />
            <MenuItem
              pathName={pathName}
              text={'Zones'}
              path={'/map/beleidshubs'}
              icon={'https://i.imgur.com/GrF8KBA.png'}
            />
            <MenuItem
              pathName={pathName}
              text={'Servicegebieden'}
              path={'/map/servicegebieden'}
              icon={'/images/components/Menu/ontwikkeling.svg'}
            />
            <Link className="text-menu" to="/login">
              Log in
            </Link>
            <Link className="text-menu" to="/docs/Over_het_Dashboard_Deelmobiliteit">
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
              pathName={pathName}
              text={'Zones'}
              path={'/admin/zones'}
              icon={'https://i.imgur.com/GrF8KBA.png'}
            />
          </div>
        </>}

      </div>
    </div>
  )

}

export default Menu;

