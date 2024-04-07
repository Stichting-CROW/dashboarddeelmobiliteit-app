// import './css/FilterbarPolicyHubs.css';
import React, {
  useEffect,
  useState,
  useCallback
} from 'react';
import {useSelector} from 'react-redux';
import { Link } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';
import { useNavigate } from "react-router-dom";
import {getAcl} from '../../api/acl';

import Logo from '../Logo.jsx';
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';
import Fieldset from '../Fieldset/Fieldset';
import { Checkbox } from "../ui/checkbox"

import {StateType} from '../../types/StateType';

import {
  get_phases
} from '../../helpers/policy-hubs/get-phases'

const CheckboxesWrapper = ({children}) => <div className="px-2 py-2 bg-white" style={{borderRadius: '0.5rem'}}>
  {children}
</div>

const CheckboxWithLabel = ({id, children}) => {
  return <div className="flex justify-start cursor-pointer my-2">
    <div className="flex flex-col justify-center">
      <Checkbox id={`${id}`} defaultChecked />
    </div>
    <label htmlFor={`${id}`} className="ml-2 flex-1 cursor-pointer">
      {children}
    </label>
  </div>;
}

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

  const policyHubPhases = get_phases();

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

      <Fieldset title="Hubs">
        <CheckboxesWrapper>
          {Object.keys(policyHubPhases).map(key => {
            const title = policyHubPhases[key].title;
            return <CheckboxWithLabel key={title} id={`hub-${key}`}>
              {title}
            </CheckboxWithLabel>
          })}
        </CheckboxesWrapper>
      </Fieldset>

      <Fieldset title="Verbodsgebieden">
        <CheckboxesWrapper>
          {Object.keys(policyHubPhases).map(key => {
            const title = policyHubPhases[key].title;
            return <CheckboxWithLabel key={title} id={`verbodsgebied-${key}`}>
              {title}
            </CheckboxWithLabel>
          })}
        </CheckboxesWrapper>
      </Fieldset>
    </div>
  )
}

export default FilterbarPolicyHubs;
