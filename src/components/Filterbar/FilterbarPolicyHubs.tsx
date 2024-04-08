// import './css/FilterbarPolicyHubs.css';
import React, {
  useEffect,
  useState,
  useCallback
} from 'react';
import {
  toggleVisibleLayer,
  unsetVisibleLayer,
  setVisibleLayer
} from '../../actions/policy-hubs';
import { useDispatch, useSelector } from 'react-redux';
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
import Modal from '../Modal/Modal';
import PolicyHubsList from '../PolicyHubsList/PolicyHubsList';

const CheckboxesWrapper = ({children}) => <div className="px-2 py-2 bg-white" style={{borderRadius: '0.5rem'}}>
  {children}
</div>

const CheckboxWithLabel = ({id, checked, onClick, children}) => {
  // console.log('id checked', id, checked)
  return <div className="flex justify-start cursor-pointer my-2" onClick={onClick}>
    <div className="flex flex-col justify-center">
      <Checkbox id={`${id}`} checked={checked} />
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
  const dispatch = useDispatch();
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

  // Get current state (active phase and visible layers)
  const active_phase = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.active_phase : '');
  const visible_layers = useSelector((state: StateType) => state.policy_hubs.visible_layers || []);

  // Get all available hub phases
  const policyHubPhases = get_phases();

  // Variable to store last active phase in
  let lastActivePhase;

  // If active_phase changes ->
  useEffect(() => {
    // Only continue if state changd
    if(lastActivePhase === active_phase) return;

    // Unset all checkboxes
    Object.keys(policyHubPhases).map(key => {
      let id = `hub-${key}`;
      dispatch(unsetVisibleLayer(id));
      id = `verbodsgebied-${key}`;
      dispatch(unsetVisibleLayer(id));
    });
    
    // Only check active phase
    dispatch(setVisibleLayer(`hub-${active_phase}`));
    dispatch(setVisibleLayer(`verbodsgebied-${active_phase}`));
    
    lastActivePhase = active_phase;
  }, [active_phase])

  return (
    <>
      <div className="filter-bar-inner py-2">

        <div style={{
          paddingBottom: '24px'
        }}>
          {! hideLogo && <Link to="/">
            <Logo />
          </Link>}
        </div>

        <div className="py-2 flex justify-between">
          <Button onClick={() => {
            // toggleTable();
          }} theme="white">
            📄 Tabel openen
          </Button>
          <Button onClick={() => {
            // toggleTable();
          }} theme="white">
            👥 Delen
          </Button>
        </div>

        <Fieldset title="Plaats">
            <FilteritemGebieden />
        </Fieldset>

        <Fieldset title="Hubs">
          <CheckboxesWrapper>
            {Object.keys(policyHubPhases).map(key => {
              const id = `hub-${key}`;
              const title = policyHubPhases[key].title;
              return <CheckboxWithLabel key={title} id={id} checked={visible_layers.indexOf(id) > -1} onClick={(e) => {
                e.preventDefault();
                dispatch(toggleVisibleLayer(id));
              }}>
                {title}
              </CheckboxWithLabel>
            })}
          </CheckboxesWrapper>
        </Fieldset>

        <Fieldset title="Verbodsgebieden">
          <CheckboxesWrapper>
            {Object.keys(policyHubPhases).map(key => {
              const id = `verbodsgebied-${key}`;
              const title = policyHubPhases[key].title;
              return <CheckboxWithLabel key={title} id={id} checked={visible_layers.indexOf(id) > -1} onClick={(e) => {
                e.preventDefault();
                dispatch(toggleVisibleLayer(id));
              }}>
                {title}
              </CheckboxWithLabel>
            })}
          </CheckboxesWrapper>
        </Fieldset>
      </div>
      <Modal
        isVisible={true}
        title=""
        // button1Title={'Terug naar de kaart'}
        // button1Handler={(e) => {
        //   // setShowRevokeModal(false);
        // }}
        button2Title={"Sluiten"}
        button2Handler={async (e) => {
          // e.preventDefault();
          // // Hide modal
          // setShowRevokeModal(false);
          // // Revoke action
          // onRevokeHandler(apiKey.id);
        }}
        hideModalHandler={() => {
          // setShowRevokeModal(false);
        }}
      >
        <PolicyHubsList />
      </Modal>
    </>
  )
}

export default FilterbarPolicyHubs;
