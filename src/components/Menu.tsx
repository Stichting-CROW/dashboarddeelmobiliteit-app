import React, { useState } from 'react';
import { Link } from "react-router-dom";
import {StateType} from '../types/StateType';

import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"

function MenuItem(props) {
  const pathName = props.pathName;
  const isActive = pathName === props.path || pathName === props.href || (pathName === '/' && props.path === '/start');
  const icon = (isActive ? props.icon.replace('.svg', '-active.svg') : props.icon);

  return (
    <>
      {props.path && <Link className={`
          text-menu
          text-center
          ${isActive ? 'is-active' : ''}
        `}
        to={props.path}
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

function Menu({
  pathName, acl
}) {
  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });
  
  const exportState = useSelector((state: StateType) => {
    return { filter: state.filter, layers: state.layers, ui:state.ui };
  });

  let menuClassName = "Menu fixed w-full mx-0 bottom-0 bg-white";
  menuClassName += " sm:bg-transparent sm:w-full";
  if(exportState && exportState.ui && exportState.ui.FILTERBAR) {
    menuClassName += ' filter-open';
  }

  const renderUserMenu = () => {
    return <>
      <MenuItem
        pathName={pathName}
        text={'Start'}
        path={'/start'}
        icon={'/images/components/Menu/start.svg'}
      />

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
        icon={'/images/components/Menu/zones.svg'}
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
    </>
  }

  const renderGuestMenu = () => {
    return <>
      <MenuItem
        pathName={pathName}
        text={'Start'}
        path={'/start'}
        icon={'/images/components/Menu/start.svg'}
      />
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
    </>
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

          {isLoggedIn && renderUserMenu()}

          {! isLoggedIn && renderGuestMenu()}

        </div>
      </div>
    </div>
  )

}

export default Menu;

