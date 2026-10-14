import React, { useEffect, useState } from 'react';
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
import { isLoggedIn } from '../../helpers/authentication';

const PolicyHubsPhaseMenu = () => {
  const dispatch = useDispatch();

  const state = useSelector((state: StateType) => state);

  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const isFilterbarOpen = useSelector((state: StateType) => state.ui && state.ui.FILTERBAR || false);

  const policyHubPhases = get_phases();
  
  const [tooltipOpen, setTooltipOpen] = useState<Record<string, boolean>>({});

  const tooltipText = (name: string) => {
    const texts = {
      'concept': 'Deze fase biedt alle vrijheid om concept-zones  in te tekenen, aan te passen en weer weg te gooien.',
      'committed_concept': 'Mail de vastgestelde zones naar aanbieders van deelvoertuigen voor een laatste check.',
      'published': 'De zones zijn definitief. Aanbieders krijgen in deze fase de tijd om de zones te verwerken in hun apps.',
      'active': 'De zones moeten verwerkt zijn in de apps. In verbodsgebieden mogen geen voertuigen aangeboden worden.'
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

        // Don't show 'Concept' to non-logged in users
        if(name === 'concept' && !isLoggedIn(state)) {
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
            {title}
            <TooltipProvider delayDuration={500}>
              <Tooltip open={tooltipOpen[name]} onOpenChange={(open) => setTooltipOpen({ ...tooltipOpen, [name]: open })}>
                <TooltipTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                    setTooltipOpen({ ...tooltipOpen, [name]: !tooltipOpen[name] });
                  }}
                >
                  <InfoCircledIcon className="inline-block ml-1 h-4 w-4 hover:text-[#15AEEF]" />
                </TooltipTrigger>
                <TooltipContent 
                  side="top"
                  align="center"
                  className="max-w-[300px] text-sm whitespace-normal text-left p-2"
                >
                  <p className="text-sm leading-tight">
                    <b>{policyHubPhases[name].title}</b><br />
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
