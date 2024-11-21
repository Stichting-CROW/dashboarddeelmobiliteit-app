import React, {
  useEffect,
  useState,
} from 'react';
import {useSelector} from 'react-redux';
import { Link } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';

import Logo from '../Logo.jsx';
import Fieldset from '../Fieldset/Fieldset';
import { Checkbox } from "../ui/checkbox"

import {StateType} from '../../types/StateType';

function FilterbarServiceAreas({
  hideLogo
}) {
  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : null
  });

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

      {! filterGebied && false && <div>
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
        {[
          'CHECK',
          'GO Sharing',
        ].map(x => <div className="
          flex items-center space-x-2
          my-2
        " key={x}>
          <Checkbox id={`aanbieder-${x}`} checked />
          <label
            htmlFor={`aanbieder-${x}`}
            className="
              text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
            "
          >
            {x}
          </label>
        </div>)}
      </Fieldset>

    </div>
  )
}

export default FilterbarServiceAreas;
