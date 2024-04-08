import React, { useEffect } from 'react';
import { setActivePhase } from '../../actions/policy-hubs';
import { useDispatch, useSelector } from 'react-redux';
import {StateType} from '../../types/StateType';

import {
    get_phases
} from '../../helpers/policy-hubs/get-phases'

const PolicyHubsPhaseMenu = () => {
    const dispatch = useDispatch();

    const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');

    const policyHubPhases = get_phases();

    return <>
        <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '360px',
            width: 'calc(100% - 360px - 70px)',
            borderRadius: '0.5rem',
            // maxWidth: '844px'
        }}>
            <div className="
                bg-white w-full py-2 px-2
                flex justify-between
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
                        ${active_phase === name ? 'font-bold' : ''}
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
                        -&gt;
                    </span>}

                </React.Fragment>
            })}
            </div>
        </div>
    </>
}

export default PolicyHubsPhaseMenu;
