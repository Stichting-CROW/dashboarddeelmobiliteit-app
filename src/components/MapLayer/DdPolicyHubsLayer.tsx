import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom'
import EventsTimeline from '../EventsTimeline/EventsTimeline';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import {
  renderServiceAreas,
  removeServiceAreasFromMap,
} from '../Map/MapUtils/map.service_areas';

import {
  renderServiceAreaDelta,
  removeServiceAreaDeltaFromMap
} from '../Map/MapUtils/map.service_area_delta';

import {
  get_phases
} from '../../helpers/policy-hubs/get-phases'

import {StateType} from '../../types/StateType.js';

const DdPolicyHubsLayer = ({
  map
}): JSX.Element => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);
  const [serviceAreaDelta, setServiceAreaDelta] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const dispatch = useDispatch()

  const displayMode = useSelector((state: StateType) => state.layers ? state.layers.displaymode : DISPLAYMODE_PARK);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');
  const filter = useSelector((state: StateType) => state.filter || null);
  const stateLayers = useSelector((state: StateType) => state.layers || null);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // // onComponentLoad
  // useEffect(() => {
  //   // Fetch service areas and store in state
  //   (async () => {
  //     const res = await fetchServiceAreas();
  //     setServiceAreas(res);
  //   })();

  //   // Fetch service areas history and store in state
  //   (async () => {
  //     const res = await fetchServiceAreasHistory();
  //     setServiceAreasHistory(res);
  //   })();
  // }, [
  //   filter.gebied
  // ]);

  // // onComponentUnLoad
  // useEffect(() => {
  //   return () => {
  //     console.log('removeServiceAreasFromMap')
  //     removeServiceAreasFromMap(map);
  //   };
  // }, [
  // ]);

  const policyHubPhases = get_phases();

  return <>
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '360px',
      width: 'calc(100% - 360px - 70px)',
      borderRadius: '0.5rem'
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
          return <>

            <a className="cursor-pointer">
              {title}
            </a>

            {/* Show 'arrow right' divided */}
            {i != Object.keys(policyHubPhases).length-2 && <span>
              -&gt;
            </span>}

          </>
        })}
      </div>
    </div>
  </>
}

export default DdPolicyHubsLayer;
