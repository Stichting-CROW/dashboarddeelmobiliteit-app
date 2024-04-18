import React, { useEffect } from 'react';
import { setActivePhase } from '../../actions/policy-hubs';
import { useDispatch, useSelector } from 'react-redux';
import {StateType} from '../../types/StateType';

import {
    get_phases
} from '../../helpers/policy-hubs/get-phases'

import arrowRight from './arrow-right.svg';
import './PolicyHubsPhaseMenu.css'

const PolicyHubsPhaseMenu = () => {
    const dispatch = useDispatch();

    const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
    const isFilterbarOpen = useSelector((state: StateType) => {
      return state.ui && state.ui.FILTERBAR || false;
    });

    const policyHubPhases = get_phases();

    return <>
        <div className={`PhaseMenu ${isFilterbarOpen ? 'filter-open' : ''}`}>
            <div className="
                PhaseMenu-inner
                px-0 mx-auto bg-white box-border w-full flex justify-center sm:px-4 sm:shadow-lg sm:m-4 sm:mb-1 sm:rounded-3xl 
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
                        {title}
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
