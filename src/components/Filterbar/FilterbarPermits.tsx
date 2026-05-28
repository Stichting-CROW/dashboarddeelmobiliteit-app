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
import {
  getPermitLimitOverviewForMunicipality,
  getPermitLimitOverviewForOperator,
  type PermitLimitRecord,
} from '../../api/permitLimits';
import { getPrettyProviderName, getProviderColorForProvider } from '../../helpers/providers';
import { isDemoMode } from '../../config/demo';
import { getDisplayOperatorName, getDisplayProviderColor } from '../../helpers/demoMode';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import {
  PRESTATIES_VIEW_URL_PARAM,
  canToggleViewMode,
  getAanbiederSystemId,
  resolveOperatorSystemId,
  resolvePrestatiesViewMode,
} from '../../helpers/prestatiesAanbiedersViewMode';
import { RadioButton } from '../ui/radio-button';

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

  const aanbieders = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });

  const aclOperators = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aclOperators) ? state.metadata.aclOperators : [];
  });

  const metadataLoaded = useSelector((state: StateType) =>
    Boolean(state.metadata && state.metadata.metadata_loaded)
  );

  const isAdmin = useSelector((state: StateType) =>
    Boolean(state.authentication?.user_data?.acl?.is_admin)
  );

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : '';
  });

  const municipalityNameByGmCode = React.useMemo(() => {
    const map = new Map<string, string>();
    gebieden.forEach((g: { gm_code?: string; name?: string }) => {
      if (g.gm_code && g.name) {
        map.set(g.gm_code, g.name);
      }
    });
    return map;
  }, [gebieden]);

  const location = useLocation();
  const pathname = location.pathname;
  const [searchParams, setSearchParams] = useSearchParams();

  const urlView = searchParams.get(PRESTATIES_VIEW_URL_PARAM);
  const viewMode = resolvePrestatiesViewMode(aclOperators, isAdmin, urlView);
  const isMunicipalityView = viewMode === 'municipality';
  const adminCanToggleView = canToggleViewMode(isAdmin, aclOperators);
  const operatorSystemId = resolveOperatorSystemId(
    aclOperators,
    searchParams.get('system_id') || searchParams.get('operator')
  );

  // Hide the "Plaats" fieldset in operator view (we group by municipality there)
  // and when the user only has access to a single municipality.
  const hidePlaats = !isMunicipalityView || gebieden.length <= 1;

  const isBeleidsinfo = pathname === '/stats/beleidsinfo';
  const isPrestatiesAanbieders = pathname === '/stats/prestaties-aanbieders';
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

  const scrollOverviewToPermitCard = (permitLimitId: string) => {
    const card = document.getElementById(`permits-card-${permitLimitId}`);
    if (!card) return;

    const overview = document.querySelector('.DashboardPrestatiesAanbieders__overview') as HTMLElement | null;
    if (!overview) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const overviewRect = overview.getBoundingClientRect();
    const paddingTop = 12;
    const targetTop = overview.scrollTop + (cardRect.top - overviewRect.top) - paddingTop;
    overview.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const currentOperator = searchParams.get('system_id') || searchParams.get('operator');
  const currentFormFactor = searchParams.get('form_factor');
  const currentGmCode = searchParams.get('gm_code');
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;

  useEffect(() => {
    if (!isPrestatiesAanbieders || !token || !metadataLoaded) {
      setAvailableCombinations([]);
      return;
    }

    if (isMunicipalityView && !filterGebied) {
      setAvailableCombinations([]);
      return;
    }

    if (!isMunicipalityView && !operatorSystemId) {
      setAvailableCombinations([]);
      return;
    }

    // Don't fetch combinations before the date range has been populated in the
    // URL. Otherwise the underlying API falls back to its 90-day default and
    // a late response can clobber the fetch made with the real (7-day) dates.
    if (!startDate || !endDate) {
      setAvailableCombinations([]);
      return;
    }

    const fetchCombinations = async () => {
      setLoadingCombinations(true);
      try {
        let results: PermitLimitRecord[] | null = null;

        if (isMunicipalityView) {
          results = await getPermitLimitOverviewForMunicipality(
            token,
            filterGebied,
            startDate,
            endDate
          );
        } else {
          const operatorResult = await getPermitLimitOverviewForOperator(
            token,
            operatorSystemId,
            startDate,
            endDate,
            undefined,
            aclOperators
          );
          results = operatorResult?.records ?? null;
        }

        if (results) {
          const uniqueCombinations = new Map<string, PermitLimitRecord>();
          results.forEach((record) => {
            const key = isMunicipalityView
              ? `${record.operator.system_id}_${record.vehicle_type.id}`
              : `${record.municipality.gmcode}_${record.vehicle_type.id}`;
            if (!uniqueCombinations.has(key)) {
              uniqueCombinations.set(key, record);
            }
          });
          setAvailableCombinations(Array.from(uniqueCombinations.values()));
        } else {
          setAvailableCombinations([]);
        }
      } catch (error) {
        console.error('Error fetching permit combinations:', error);
        setAvailableCombinations([]);
      } finally {
        setLoadingCombinations(false);
      }
    };

    fetchCombinations();
  }, [
    isPrestatiesAanbieders,
    isMunicipalityView,
    filterGebied,
    operatorSystemId,
    token,
    startDate,
    endDate,
    metadataLoaded,
    aclOperators,
  ]);

  const sortedCombinations = React.useMemo(() => {
    const combinations = [...availableCombinations];
    if (isMunicipalityView) return combinations;

    return combinations.sort((a, b) => {
      const nameA =
        municipalityNameByGmCode.get(a.municipality.gmcode) ||
        a.municipality.name ||
        a.municipality.gmcode;
      const nameB =
        municipalityNameByGmCode.get(b.municipality.gmcode) ||
        b.municipality.name ||
        b.municipality.gmcode;
      const byName = nameA.localeCompare(nameB, 'nl', { sensitivity: 'base' });
      if (byName !== 0) return byName;

      const vehicleA = getPrettyVehicleTypeName(a.vehicle_type.id) || a.vehicle_type.id;
      const vehicleB = getPrettyVehicleTypeName(b.vehicle_type.id) || b.vehicle_type.id;
      return vehicleA.localeCompare(vehicleB, 'nl', { sensitivity: 'base' });
    });
  }, [availableCombinations, isMunicipalityView, municipalityNameByGmCode]);

  const handleViewModeChange = (nextViewMode: 'municipality' | 'operator') => {
    if (nextViewMode === viewMode) return;

    const next = new URLSearchParams(searchParams);
    if (nextViewMode === 'operator') {
      next.set(PRESTATIES_VIEW_URL_PARAM, 'operator');
    } else {
      next.delete(PRESTATIES_VIEW_URL_PARAM);
      // Clear the operator-scoped selection when switching to municipality view
      // so the dashboard doesn't auto-open a details panel from a stale operator.
      next.delete('system_id');
      next.delete('operator');
      next.delete('form_factor');
      next.delete('propulsion_type');
    }
    // Clear any drill-down so we land on the overview after switching.
    next.delete('gm_code');
    setSearchParams(next);
  };

  const handleOperatorSelect = (operatorId: string) => {
    if (operatorId === operatorSystemId) return;

    const next = new URLSearchParams(searchParams);
    next.set('system_id', operatorId);
    next.set('operator', operatorId);
    next.delete('gm_code');
    next.delete('form_factor');
    next.delete('propulsion_type');
    setSearchParams(next);
  };

  const handleCombinationClick = (operatorId: string, formFactor: string, gmCode?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);

    newSearchParams.set('system_id', operatorId);
    newSearchParams.set('operator', operatorId);
    newSearchParams.set('form_factor', formFactor);
    if (gmCode) {
      newSearchParams.set('gm_code', gmCode);
    }

    setSearchParams(newSearchParams);

    const match = availableCombinations.find((record) => {
      const operatorMatch = record.operator.system_id === operatorId;
      const formFactorMatch = record.vehicle_type.id === formFactor;
      const gmMatch = !gmCode || record.municipality.gmcode === gmCode;
      return operatorMatch && formFactorMatch && gmMatch;
    });
    const permitLimitId = match?.permit_limit?.permit_limit_id;
    if (permitLimitId) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollOverviewToPermitCard(String(permitLimitId));
        });
      });
    }
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
          showPresetOptionsByDefault={isPrestatiesAanbieders}
        />
      </Fieldset>

      {! hidePlaats && <Fieldset title="Plaats">
        <FilteritemGebieden />
      </Fieldset>}

      {adminCanToggleView && (
        <Fieldset title="Weergave">
          {(
            [
              { id: 'municipality', label: 'Bekijk als gemeente' },
              { id: 'operator', label: 'Bekijk als aanbieder' },
            ] as const
          ).map((option) => (
            <div
              key={`view-mode-${option.id}`}
              className="flex items-center space-x-2 my-2"
              onClick={(e) => {
                e.preventDefault();
                handleViewModeChange(option.id);
              }}
            >
              <RadioButton
                id={`view-mode-${option.id}`}
                checked={viewMode === option.id}
              />
              <label
                htmlFor={`view-mode-${option.id}`}
                className="
                  text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
                  cursor-pointer
                "
              >
                {option.label}
              </label>
            </div>
          ))}
        </Fieldset>
      )}

      {adminCanToggleView && !isMunicipalityView && (
        <Fieldset title="Aanbieder">
          {aanbieders.length === 0 ? (
            <div className="text-sm text-gray-500">Geen aanbieders beschikbaar</div>
          ) : (
            aanbieders.map((aanbieder: { system_id?: string; value?: string; name?: string }) => {
              const operatorId = getAanbiederSystemId(aanbieder);
              if (!operatorId) return null;
              const realName = aanbieder.name || getPrettyProviderName(operatorId) || operatorId;
              const displayName = getDisplayOperatorName(operatorId, realName, isDemoMode());
              return (
                <div
                  key={`admin-operator-${operatorId}`}
                  className="flex items-center space-x-2 my-2"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOperatorSelect(operatorId);
                  }}
                >
                  <RadioButton
                    id={`admin-operator-${operatorId}`}
                    checked={operatorSystemId === operatorId}
                    color={getDisplayProviderColor(
                      operatorId,
                      getProviderColorForProvider(operatorId),
                      isDemoMode()
                    )}
                  />
                  <label
                    htmlFor={`admin-operator-${operatorId}`}
                    className="
                      text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
                      cursor-pointer
                    "
                  >
                    {displayName}
                  </label>
                </div>
              );
            })
          )}
        </Fieldset>
      )}

      {(true || isPrestatiesDetailsView) && (
        <Fieldset title={isMunicipalityView ? 'Aanbieders' : 'Gemeenten'}>
          {loadingCombinations ? (
            <div className="text-sm text-gray-500">Laden...</div>
          ) : sortedCombinations.length === 0 ? (
            <div className="text-sm text-gray-500">Geen combinaties beschikbaar</div>
          ) : (
            sortedCombinations.map((record) => {
              const operatorId = record.operator.system_id;
              const formFactor = record.vehicle_type.id;
              const gmCode = record.municipality.gmcode;
              const isSelected = isMunicipalityView
                ? currentOperator === operatorId && currentFormFactor === formFactor
                : currentGmCode === gmCode && currentFormFactor === formFactor;
              const realOperatorName = getPrettyProviderName(operatorId);
              const operatorName = getDisplayOperatorName(operatorId, realOperatorName, isDemoMode());
              const formFactorName = getPrettyVehicleTypeName(formFactor) || formFactor;
              const combinationKey = isMunicipalityView
                ? `${operatorId}_${formFactor}`
                : `${gmCode}_${formFactor}`;
              const municipalityName =
                municipalityNameByGmCode.get(gmCode) || record.municipality.name || gmCode;
              const label = isMunicipalityView
                ? `${operatorName} - ${formFactorName}`
                : `${municipalityName} - ${formFactorName}`;

              return (
                <div
                  key={combinationKey}
                  className="
                    flex items-center space-x-2
                    my-2
                  "
                  onClick={(e) => {
                    e.preventDefault();
                    handleCombinationClick(operatorId, formFactor, gmCode);
                  }}
                >
                  <RadioButton
                    id={`aanbieder-${combinationKey}`}
                    checked={isSelected}
                    color={getDisplayProviderColor(
                      operatorId,
                      getProviderColorForProvider(operatorId),
                      isDemoMode()
                    )}
                  />
                  <label
                    htmlFor={`aanbieder-${combinationKey}`}
                    className="
                      text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
                      cursor-pointer
                    "
                  >
                    {label}
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
