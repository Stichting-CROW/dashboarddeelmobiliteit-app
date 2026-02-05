import React, { useEffect, useState } from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';

import {useSelector, useDispatch} from 'react-redux';
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilterbarExtended from './FilterbarExtended.jsx';
import { addDays, format } from 'date-fns';

import Logo from '../Logo.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import Fieldset from '../Fieldset/Fieldset';

import {StateType} from '../../types/StateType';
import FilteritemDatumVanTot from './FilteritemDatumVanTot';
import { getPermitLimitOverviewForMunicipality, type PermitLimitRecord } from '../../api/permitLimits';
import { getPrettyProviderName, getProviderColorForProvider } from '../../helpers/providers';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import { Checkbox } from '../ui/checkbox';

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
  const [searchParams, setSearchParams] = useSearchParams();

  const isBeleidsinfo = pathname === '/dashboard/beleidsinfo';
  const isPrestatiesAanbieders = pathname === '/dashboard/prestaties-aanbieders';
  const isPrestatiesAanbiedersDetails = pathname === '/dashboard/prestaties-aanbieders-details';

  const token = useSelector((state: StateType) => 
    (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
  );

  const [availableCombinations, setAvailableCombinations] = useState<PermitLimitRecord[]>([]);
  const [loadingCombinations, setLoadingCombinations] = useState(false);

  // Get current selected operator and form_factor from query params
  const currentOperator = searchParams.get('system_id') || searchParams.get('operator');
  const currentFormFactor = searchParams.get('form_factor');

  // Fetch available operator/form_factor combinations when municipality changes and we're on details page
  useEffect(() => {
    if (!isPrestatiesAanbiedersDetails || !filterGebied || !token) {
      setAvailableCombinations([]);
      return;
    }

    const fetchCombinations = async () => {
      setLoadingCombinations(true);
      try {
        const results = await getPermitLimitOverviewForMunicipality(token, filterGebied);
        if (results) {
          // Deduplicate combinations by operator + form_factor
          const uniqueCombinations = new Map<string, PermitLimitRecord>();
          results.forEach((record) => {
            const key = `${record.operator.system_id}_${record.vehicle_type.id}`;
            if (!uniqueCombinations.has(key)) {
              uniqueCombinations.set(key, record);
            }
          });
          setAvailableCombinations(Array.from(uniqueCombinations.values()));
        } else {
          setAvailableCombinations([]);
        }
      } catch (error) {
        console.error('Error fetching operator/form_factor combinations:', error);
        setAvailableCombinations([]);
      } finally {
        setLoadingCombinations(false);
      }
    };

    fetchCombinations();
  }, [isPrestatiesAanbiedersDetails, filterGebied, token]);

  // Handler for clicking a combination checkbox
  const handleCombinationClick = (operatorId: string, formFactor: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Set operator (both system_id and operator for backward compatibility)
    newSearchParams.set('system_id', operatorId);
    newSearchParams.set('operator', operatorId);
    newSearchParams.set('form_factor', formFactor);
    
    setSearchParams(newSearchParams);
  };

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
    if (isBeleidsinfo) {
      return 'Beleidsinfo';
    } else if (isPrestatiesAanbieders) {
      return 'Prestaties aanbieders';
    } else if (isPrestatiesAanbiedersDetails) {
      return 'Prestaties aanbieders details';
    }
    return 'Prestaties aanbieders';
  };

  const renderSelectDashboardType = () => {
    return (
      <FilterbarExtended
        title="Selecteer statistiek"
        closeFunction={() => toggleDashboardType(false)}
      >
        <div className="filter-form-selectie">
          <div className="filter-form-values">
          <div
              key={'item-beleidsinfo'}
              className={`form-item ${isBeleidsinfo ? 'form-item-selected' : ''}`}
              onClick={() => handleSelectDashboardType('/dashboard/beleidsinfo')}
            >
              Beleidsinfo
            </div>
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

      <Fieldset title="Statistiek">
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

      {isPrestatiesAanbiedersDetails && (
        <Fieldset title="Aanbieders">
          {loadingCombinations ? (
            <div className="text-sm text-gray-500">Laden...</div>
          ) : availableCombinations.length === 0 ? (
            <div className="text-sm text-gray-500">Geen combinaties beschikbaar</div>
          ) : (
            availableCombinations.map((record) => {
              const operatorId = record.operator.system_id;
              const formFactor = record.vehicle_type.id;
              const isSelected = currentOperator === operatorId && currentFormFactor === formFactor;
              const operatorName = getPrettyProviderName(operatorId);
              const formFactorName = getPrettyVehicleTypeName(formFactor) || formFactor;
              const combinationKey = `${operatorId}_${formFactor}`;
              
              return (
                <div
                  key={combinationKey}
                  className="
                    flex items-center space-x-2
                    my-2
                  "
                  onClick={(e) => {
                    e.preventDefault();
                    handleCombinationClick(operatorId, formFactor);
                  }}
                >
                  <Checkbox
                    id={`aanbieder-${combinationKey}`}
                    checked={isSelected}
                    color={getProviderColorForProvider(operatorId)}
                  />
                  <label
                    htmlFor={`aanbieder-${combinationKey}`}
                    className="
                      text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
                      cursor-pointer
                    "
                  >
                    {operatorName} - {formFactorName}
                  </label>
                </div>
              );
            })
          )}
        </Fieldset>
      )}

    </div>
  )
}

export default FilterbarPermits;
