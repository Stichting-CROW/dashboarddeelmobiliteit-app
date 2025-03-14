import React, { useEffect } from 'react';
import { setActivePhase } from '../../actions/policy-hubs';
import { useDispatch, useSelector } from 'react-redux';
import {StateType} from '../../types/StateType';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"

import {
  get_phases
} from '../../helpers/policy-hubs/get-phases'

import arrowRight from './arrow-right.svg';
import './PolicyHubsPhaseMenu.css'

const PolicyHubsPhaseMenu = () => {
  const dispatch = useDispatch();

  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const isFilterbarOpen = useSelector((state: StateType) => state.ui && state.ui.FILTERBAR || false);

  const policyHubPhases = get_phases();

  const tooltipText = (name: string) => {
    const texts = {
      'concept': 'Conceptfase: Zones die nog in ontwikkeling zijn',
      'committed_concept': 'Vastgestelde concepten: Zones die zijn vastgesteld maar nog niet gepubliceerd',
      'published': 'Gepubliceerde zones: Zones die zijn gepubliceerd maar nog niet actief',
      'active': 'Actieve zones: Zones die momenteel van kracht zijn'
    }
    return texts[name];
  }

  return <>
    <div className={`PhaseMenu text-center ${isFilterbarOpen ? 'filter-open' : ''}`}>
      <div className="
          PhaseMenu-inner
          px-0 mx-auto bg-white box-border sm:px-4 sm:shadow-lg sm:m-4 md:mx-auto sm:mb-1 sm:rounded-3xl
      ">
      {Object.keys(policyHubPhases).map((name, i) => {
          // Get phase title
          const title = policyHubPhases[name].title;

          // Don't show 'Archief'
          if(title === 'Archief') {
              return;
          }

          // Show phase title
          return <React.Fragment key={name}>

              <a className={`
                  cursor-pointer
                  ${active_phase === name ? '' : ''}
              `}
              style={{
                  color: active_phase === name ? '#15AEEF' : '#000'
              }}
              onClick={(e) => {
                e.preventDefault();
                dispatch(setActivePhase(name));
              }}>
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger>
                      {title}
                      <InfoCircledIcon className="inline-block ml-1 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side={i === 0 ? "top" : i === Object.keys(policyHubPhases).length - 2 ? "top" : "top"}
                      className="max-w-[200px] text-sm whitespace-normal text-left p-2"
                    >
                      <p className="leading-tight">
                        {tooltipText(name)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </a>

              {/* Show 'arrow right' divided */}
              {i != Object.keys(policyHubPhases).length-2 && <span>
                <img src={arrowRight} alt="Pijl naar rechts" className="inline-block" />
              </span>}

          </React.Fragment>
      })}
      </div>
    </div>
  </>
}

export default PolicyHubsPhaseMenu;
