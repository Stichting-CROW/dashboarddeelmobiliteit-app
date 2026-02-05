import React from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';

import {useSelector, useDispatch} from 'react-redux';
import { Link, useLocation, useNavigate } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilterbarExtended from './FilterbarExtended.jsx';
import { addDays, format } from 'date-fns';

import Logo from '../Logo.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import Fieldset from '../Fieldset/Fieldset';

import {StateType} from '../../types/StateType';
import FilteritemDatumVanTot from './FilteritemDatumVanTot';

interface FilterbarPermitsProps {
  hideLogo: boolean;
  hideDatumTijd: boolean;
}

function FilterbarPermits({
  hideLogo,
  hideDatumTijd = true,
}: FilterbarPermitsProps) {
  // const [organisation, setOrganisation] = useState<OrganisationType | false | undefined>(undefined);

  // const token = useSelector((state: StateType) => {
  //   return state.authentication.token;
  // });

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

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : "";
  });

  const filterOntwikkelingVan = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingvan ? new Date(state.filter.ontwikkelingvan) : null;
  });

  const filterOntwikkelingTot = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingtot ? new Date(state.filter.ontwikkelingtot) : null;
  });

  const hidePlaats = gebieden.length <= 1;

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const isPrestatiesAanbieders = pathname === '/dashboard/prestaties-aanbieders';
  const isPrestatiesAanbiedersDetails = pathname === '/dashboard/prestaties-aanbieders-details';

  const filterBarExtendedView = useSelector((state: StateType) => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

  const setVisibility = (name: string, visibility: any) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    });
  };

  const toggleDashboardType = (val: string | false) => {
    setVisibility('FILTERBAR_EXTENDED', val);
  };

  const handleSelectDashboardType = (path: string) => {
    const searchParams = new URLSearchParams();
    
    // Add gm_code if available
    if (filterGebied) {
      searchParams.set('gm_code', filterGebied);
    }
    
    // Add start_date and end_date if available
    if (filterOntwikkelingVan) {
      searchParams.set('start_date', format(filterOntwikkelingVan, 'yyyy-MM-dd'));
    }
    
    if (filterOntwikkelingTot) {
      searchParams.set('end_date', format(filterOntwikkelingTot, 'yyyy-MM-dd'));
    }
    
    // Build the URL with query parameters
    const queryString = searchParams.toString();
    const url = queryString ? `${path}?${queryString}` : path;
    
    navigate(url);
    toggleDashboardType(false);
  };

  const getCurrentSelection = () => {
    if (isPrestatiesAanbieders) {
      return 'Prestaties aanbieders';
    } else if (isPrestatiesAanbiedersDetails) {
      return 'Prestaties aanbieders details';
    }
    return 'Prestaties aanbieders';
  };

  const renderSelectDashboardType = () => {
    return (
      <FilterbarExtended
        title="Selecteer dashboard type"
        closeFunction={() => toggleDashboardType(false)}
      >
        <div className="filter-form-selectie">
          <div className="filter-form-values">
            <div
              key={'item-prestaties-aanbieders'}
              className={`form-item ${isPrestatiesAanbieders ? 'form-item-selected' : ''}`}
              onClick={() => handleSelectDashboardType('/dashboard/prestaties-aanbieders')}
            >
              Prestaties aanbieders
            </div>
            <div
              key={'item-prestaties-aanbieders-details'}
              className={`form-item ${isPrestatiesAanbiedersDetails ? 'form-item-selected' : ''}`}
              onClick={() => handleSelectDashboardType('/dashboard/prestaties-aanbieders-details')}
            >
              Prestaties aanbieders details
            </div>
          </div>
        </div>
      </FilterbarExtended>
    );
  };

  return (
    <div className="filter-bar-inner py-2">

      <div style={{
        paddingBottom: '24px'
      }}>
        {! hideLogo && <Link to="/"><Logo /></Link>}
      </div>
      
      {! hideDatumTijd &&  <FilteritemDatum disabled={true} />}

      <Fieldset title="Dashboard">
        <div className="filter-plaats-container">
          <div className="filter-plaats-box-row">
            <div
              className={`filter-plaats-value ${isPrestatiesAanbieders || isPrestatiesAanbiedersDetails ? '' : 'text-black'}`}
              onClick={() => toggleDashboardType('dashboard-type')}
            >
              {getCurrentSelection()}
            </div>
            {filterBarExtendedView === 'dashboard-type' ? renderSelectDashboardType() : null}
          </div>
        </div>
      </Fieldset>

      <Fieldset title="Periode">
        <FilteritemDatumVanTot 
          presetButtons={[
            { key: 'fdvt-po1', view: 'laatste7dagen_yesterday', label: 'Laatste 7 dagen' },
            { key: 'fdvt-po2', view: 'laatste14dagen_yesterday', label: 'Laatste 14 dagen' },
            { key: 'fdvt-po3', view: 'laatste30dagen_yesterday', label: 'Laatste 30 dagen' },
            { key: 'fdvt-po4', view: 'laatste90dagen_yesterday', label: 'Laatste 90 dagen' },
          ]}
          defaultStartDate={new Date(addDays(new Date(), -7).toDateString())}
          defaultEndDate={new Date(addDays(new Date(), -1).toDateString())}
        />
      </Fieldset>

      {! hidePlaats && <Fieldset title="Plaats">
        <FilteritemGebieden />
      </Fieldset>}

    </div>
  )
}

export default FilterbarPermits;
