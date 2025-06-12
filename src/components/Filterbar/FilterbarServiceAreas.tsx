import React, {
  useEffect,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux';
import { Link } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';
import {
  toggleServiceAreaForOperator,
  showServiceAreaForOperator
} from '../../actions/service-areas';
import { getPrettyProviderName, getProviderColorForProvider } from '../../helpers/providers';
import { loadServiceAreas, loadServiceAreasHistory } from '../../helpers/service-areas';
import { loadServiceAreaDeltas } from '../../helpers/service-areas';
import {
  renderServiceAreas,
  removeServiceAreasFromMap,
} from '../Map/MapUtils/map.service_areas';
import {
  renderServiceAreaDelta,
  removeServiceAreaDeltaFromMap
} from '../Map/MapUtils/map.service_area_delta';

import moment from 'moment';

import { ServiceAreaDelta } from '@/src/types/ServiceAreaDelta';

import Logo from '../Logo.jsx';
import Fieldset from '../Fieldset/Fieldset';
import { Checkbox } from "../ui/checkbox"

import {StateType} from '../../types/StateType';
import { getAvailableOperators } from '../../api/service-areas';

const ServiceAreaHistory = ({
  visible_operators
}) => {
  const filter = useSelector((state: StateType) => state.filter || null);

  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasHistory, setServiceAreasHistory] = useState([]);
  const [serviceAreaDelta, setServiceAreaDelta] = useState<ServiceAreaDelta | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Load new service areas
    (async () => {
      const service_areas = await loadServiceAreas(filter.gebied, visible_operators);
      setServiceAreas(service_areas);
    })();

    (async () => {
      // Get service area history
      const service_area_history = await loadServiceAreasHistory(filter.gebied, visible_operators);
      // Sort by valid_from descending
      service_area_history.sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime());
      // Set in state
      setServiceAreasHistory(service_area_history);
    })();
  }, [
    filter.gebied,
    visible_operators
  ]);

  // Load 'delta' if version_id or visible_operators changes
  useEffect(() => {
    if(! searchParams.get('version')) return;

    (async () => {
      const response = await loadServiceAreaDeltas(visible_operators, searchParams);
      setServiceAreaDelta(response);
    })();
  }, [
    searchParams,
  ]);

  // Do things if 'serviceAreaDelta' change
  useEffect(() => {
    // Return if no service areas were found
    if (!serviceAreaDelta) return;

    const map = window['ddMap'];

    // Remove old service area delta
    removeServiceAreasFromMap(map);

    // Render service area delta
    renderServiceAreaDelta(map, serviceAreaDelta);

    // onComponentUnLoad
    return () => {
    };
  }, [serviceAreaDelta]);

  return <div>
    <a key="actueel" className={`text-sm block cursor-pointer group ${(!searchParams.get('version') || searchParams.get('version') == serviceAreas[0]?.service_area_version_id) ? 'font-bold' : ''}`} onClick={() => {
      setSearchParams({ version: serviceAreas[0]?.service_area_version_id });
    }}>
      Actueel
    </a>

    {/* Skip the first 1 */}
    {serviceAreasHistory.slice(1).map(x => <a key={x.id} className={`text-sm block cursor-pointer group ${searchParams.get('version') == x.service_area_version_id ? 'font-bold' : ''}`} onClick={() => {
      setSearchParams({ version: x.service_area_version_id });
    }}>
      {moment(x.valid_from).format('DD-MM-YYYY')}&nbsp;
      <span className={`opacity-${searchParams.get('version') == x.service_area_version_id ? '1' : '0'} transition-opacity`}>
        {moment(x.valid_from).format('HH:mm')}
      </span>
    </a>)}
  </div>
}

function FilterbarServiceAreas({
  hideLogo
}) {
  const dispatch = useDispatch();

  const municipality = useSelector((state: StateType) => state.filter ? state.filter.gebied : null);
  const visible_operators = useSelector((state: StateType) => state.service_areas ? state.service_areas.visible_operators : null);

  const [availableOperators, setAvailableOperators] = useState([]);

  useEffect(() => {
    getAvailableOperators(municipality).then((operators) => {
      if(! operators) return;
      setAvailableOperators(operators.operators_with_service_area || []);
    });
  }, [municipality]);

  return (
    <div className="filter-bar-inner py-2">

      <div style={{
        paddingBottom: '24px'
      }}>
        {! hideLogo && <Link to="/"><Logo /></Link>}
      </div>
      
      <Fieldset title="Plaats">
        <FilteritemGebieden />
      </Fieldset>

      {! municipality && false && <div>
        Selecteer een plaats.
      </div>}

      <Fieldset title="Aanbieders">
        {availableOperators.map(x => <div className="
          flex items-center space-x-2
          my-2
        "
        key={x}
        onClick={(e) => {
          e.preventDefault();

          // Save operator selection to redux store
          dispatch(showServiceAreaForOperator(x));
        }}
        >
          <Checkbox
            id={`aanbieder-${x}`}
            checked={visible_operators.includes(x)}
            color={getProviderColorForProvider(x)}
          />
          <label
            htmlFor={`aanbieder-${x}`}
            className="
              text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
            "
          >
            {getPrettyProviderName(x)}
          </label>
        </div>)}
      </Fieldset>

      <Fieldset title="Historische servicegebieden">
        <ServiceAreaHistory
          visible_operators={visible_operators}
        />
      </Fieldset>

    </div>
  )
}

export default FilterbarServiceAreas;
