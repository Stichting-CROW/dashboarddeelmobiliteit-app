import React, {
  useEffect,
  useState,
} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { Link } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';
import {
  toggleServiceAreaForOperator,
  showServiceAreaForOperator
} from '../../actions/service-areas';
import { getPrettyProviderName } from '../../helpers/providers';

import Logo from '../Logo.jsx';
import Fieldset from '../Fieldset/Fieldset';
import { Checkbox } from "../ui/checkbox"

import {StateType} from '../../types/StateType';
import { getAvailableOperators } from '../../api/service-areas';
function FilterbarServiceAreas({
  hideLogo
}) {
  const municipality = useSelector((state: StateType) => state.filter ? state.filter.gebied : null);
  const visible_operators = useSelector((state: StateType) => state.service_areas ? state.service_areas.visible_operators : null);
  const [availableOperators, setAvailableOperators] = useState([]);

  useEffect(() => {
    getAvailableOperators(municipality).then((operators) => {
      if(! operators) return;
      setAvailableOperators(operators.operators_with_service_area);
    });
  }, [municipality]);

  const dispatch = useDispatch();

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

      {/* <Fieldset title="Zonelagen">
        {[
          'Microhubs',
          'Verbodszones',
          'Analysezones'
        ].map(x => <div className="
          flex items-center space-x-2
          my-2
        ">
          <Checkbox id={`zonelaag-${x}`} />
          <label
            htmlFor={`zonelaag-${x}`}
            className="
                text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
            "
          >
            {x}
          </label>
        </div>)}
      </Fieldset> */}

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

    </div>
  )
}

export default FilterbarServiceAreas;
