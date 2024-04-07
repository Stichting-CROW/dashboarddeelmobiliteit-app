// import './css/FilterbarPolicyHubs.css';
import React, {
  useEffect,
  useState,
  useCallback
} from 'react';
import {useLocation} from "react-router-dom";
import {useSelector} from 'react-redux';
import st from 'geojson-bounds';
import { Link } from "react-router-dom";
import * as R from 'ramda';
import center from '@turf/center'
import FilteritemGebieden from './FilteritemGebieden.jsx';
import { useNavigate } from "react-router-dom";
import {getAcl} from '../../api/acl';

import Logo from '../Logo.jsx';
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';
import Fieldset from '../Fieldset/Fieldset';
import { Checkbox } from "../ui/checkbox"

import {StateType} from '../../types/StateType';

// Import API functions
import {
  postZone,
  putZone,
  deleteZone
} from '../../api/zones';

function FilterbarPolicyHubs({
  hideLogo,
  view
}) {
  const navigate = useNavigate();

  const labelClassNames = 'mb-2 text-sm';

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : null
  });

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

//   // Store window location in a local variable
//   let location = useLocation();
//   useEffect(() => {
//     setPathName(location ? location.pathname : null);
//   }, [location]);

//   // Get ACL
//   useEffect(() => {
//     if(! token) return;
//     (async () => {
//       const acl: any = await getAcl(token);
//       setCanEditMicrohubs(acl.is_admin || (acl.privileges && acl.privileges.indexOf('MICROHUB_EDIT') > -1));
//     })();
//   }, [token])

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

    </div>
  )
}

export default FilterbarPolicyHubs;
