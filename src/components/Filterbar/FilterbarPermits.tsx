import React, { useEffect, useState } from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';

import { useSelector } from 'react-redux';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import { addDays } from 'date-fns';

import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';
import FilteritemDatum from './FilteritemDatum.jsx';
import Fieldset from '../Fieldset/Fieldset';
import FilterbarStatistiek from './FilterbarStatistiek';

import { StateType } from '../../types/StateType';
import FilteritemDatumVanTot from './FilteritemDatumVanTot';
import { getPermitLimitOverviewForMunicipality, type PermitLimitRecord } from '../../api/permitLimits';
import { getPrettyProviderName, getProviderColorForProvider } from '../../helpers/providers';
import { isDemoMode } from '../../config/demo';
import { getDisplayOperatorName, getDisplayProviderColor } from '../../helpers/demoMode';
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
    return state.filter ? state.filter.gebied : '';
  });

  const hidePlaats = gebieden.length <= 1;

  const location = useLocation();
  const pathname = location.pathname;
  const [searchParams, setSearchParams] = useSearchParams();

  const isBeleidsinfo = pathname === '/dashboard/beleidsinfo';
  const isPrestatiesAanbieders = pathname === '/dashboard/prestaties-aanbieders';
  const hasDetailParams = Boolean(
    searchParams.get('gm_code') &&
    (searchParams.get('operator') || searchParams.get('system_id')) &&
    searchParams.get('form_factor')
  );
  const isPrestatiesDetailsView = isPrestatiesAanbieders && hasDetailParams;

  const token = useSelector((state: StateType) => 
    (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
  );

  const [availableCombinations, setAvailableCombinations] = useState<PermitLimitRecord[]>([]);
  const [loadingCombinations, setLoadingCombinations] = useState(false);

  // Get current selected operator and form_factor from query params
  const currentOperator = searchParams.get('system_id') || searchParams.get('operator');
  const currentFormFactor = searchParams.get('form_factor');

  // Fetch available operator/form_factor combinations when municipality is selected
  useEffect(() => {
    if (!isPrestatiesAanbieders || !filterGebied || !token) {
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
  }, [isPrestatiesAanbieders, filterGebied, token]);

  // Handler for clicking a combination checkbox
  const handleCombinationClick = (operatorId: string, formFactor: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Set operator (both system_id and operator for backward compatibility)
    newSearchParams.set('system_id', operatorId);
    newSearchParams.set('operator', operatorId);
    newSearchParams.set('form_factor', formFactor);
    
    setSearchParams(newSearchParams);
  };

  return (
    <div className="filter-bar-inner">

      <div style={{
        paddingBottom: '48px'
      }}>
        {! hideLogo && <Link to="/"><LogoDashboardDeelmobiliteit /></Link>}
      </div>
      
      {!hideDatumTijd && <FilteritemDatum disabled={true} />}

      <FilterbarStatistiek />

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

      {isPrestatiesDetailsView && (
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
              const realOperatorName = getPrettyProviderName(operatorId);
              const operatorName = getDisplayOperatorName(operatorId, realOperatorName, isDemoMode());
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
                    color={getDisplayProviderColor(operatorId, getProviderColorForProvider(operatorId), isDemoMode())}
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
