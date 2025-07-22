import React, {
  useEffect,
  useState,
} from 'react';
import './css/FilterbarStart.css';

import {useSelector} from 'react-redux';
import { Link } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';

import Logo from '../Logo.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import Fieldset from '../Fieldset/Fieldset';

import {StateType} from '../../types/StateType';
import { OrganisationType } from '@/src/types/OrganisationType';
import { getOwnOrganisation } from '../../api/organisations';

interface FilterbarStartProps {
  hideLogo: boolean;
  hideDatumTijd: boolean;
}

function FilterbarStart({
  hideLogo,
  hideDatumTijd = true,
}: FilterbarStartProps) {
  const [organisation, setOrganisation] = useState<OrganisationType | false | undefined>(undefined);

  const token = useSelector((state: StateType) => {
    return state.authentication.token;
  });

  // useEffect(() => {
  //   const fetchOrganisation = async () => {
  //     const organisation = await getOwnOrganisation(token);
  //     setOrganisation(organisation);
  //   }

  //   fetchOrganisation();
  // }, [token])

  const gebieden = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  // const filterGebied = useSelector((state: StateType) => {
  //   return state.filter ? state.filter.gebied : null
  // });


  const hidePlaats = gebieden.length <= 1;

  return (
    <div className="filter-bar-inner py-2">

      <div style={{
        paddingBottom: '24px'
      }}>
        {! hideLogo && <Link to="/"><Logo /></Link>}
      </div>
      
      {! hideDatumTijd &&  <FilteritemDatum disabled={true} />}

      {! hidePlaats && <Fieldset title="Plaats">
        <FilteritemGebieden />
      </Fieldset>}

    </div>
  )
}

export default FilterbarStart;
