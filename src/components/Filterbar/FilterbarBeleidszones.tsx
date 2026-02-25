import React, { useEffect, useRef } from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';

import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { addDays } from 'date-fns';

import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';
import Fieldset from '../Fieldset/Fieldset';
import FilterbarStatistiek from './FilterbarStatistiek';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatumVanTot from './FilteritemDatumVanTot';
import FilteritemZones from './FilteritemZones.jsx';
import FilteritemAanbieders from './FilteritemAanbieders';

import { StateType } from '../../types/StateType';

interface FilterbarBeleidszonesProps {
  hideLogo: boolean;
}

function FilterbarBeleidszones({ hideLogo }: FilterbarBeleidszonesProps) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const gebieden = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  const filterGebied = useSelector((state: StateType) =>
    state.filter ? state.filter.gebied : null
  );

  const filterZones = useSelector((state: StateType) =>
    state.filter ? state.filter.zones : null
  );

  const hidePlaats = gebieden.length <= 1;
  const hasSkippedInitialSync = useRef(false);

  // Sync active zones (and plaats) to URL when user selects in Filterbar
  useEffect(() => {
    if (location.pathname !== '/stats/beleidszones') return;

    const currentParams = new URLSearchParams(location.search);
    if (
      !hasSkippedInitialSync.current &&
      (currentParams.has('zones') || currentParams.has('gm_code'))
    ) {
      hasSkippedInitialSync.current = true;
      return;
    }

    const params = new URLSearchParams(location.search);
    if (filterGebied) {
      params.set('gm_code', filterGebied);
    } else {
      params.delete('gm_code');
    }
    if (filterZones && String(filterZones).trim()) {
      params.set('zones', String(filterZones).trim());
    } else {
      params.delete('zones');
    }
    const newSearch = params.toString();
    const currentSearch = location.search ? location.search.slice(1) : '';
    if (newSearch !== currentSearch) {
      navigate(`/stats/beleidszones${newSearch ? `?${newSearch}` : ''}`, {
        replace: true
      });
    }
  }, [filterGebied, filterZones]);

  // Initialize filter from URL params when navigating to beleidszones with preselected hub/date
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlGmCode = params.get('gm_code');
    const urlZones = params.get('zones');

    if (urlGmCode && urlGmCode !== filterGebied) {
      dispatch({ type: 'SET_FILTER_GEBIED', payload: urlGmCode });
    }
    if (urlZones) {
      dispatch({ type: 'SET_FILTER_ZONES', payload: urlZones });
    }
  }, [location.search]); // Only run when URL search changes (e.g. initial nav or back)

  return (
    <div className="filter-bar-inner">
      <div style={{ paddingBottom: '48px' }}>
        {!hideLogo && (
          <Link to="/">
            <LogoDashboardDeelmobiliteit />
          </Link>
        )}
      </div>

      <FilterbarStatistiek />

      <Fieldset title="Periode">
        <FilteritemDatumVanTot
          presetButtons={[
            { key: 'fdvt-po1', view: 'vandaag', label: 'Vandaag' },
            { key: 'fdvt-po2', view: 'laatste2dagen', label: 'Laatste 2 dagen' },
            { key: 'fdvt-po3', view: 'laatste7dagen', label: 'Laatste 7 dagen' },
            { key: 'fdvt-po4', view: 'laatste30dagen', label: 'Laatste 30 dagen' },
            { key: 'fdvt-po5', view: 'laatste90dagen', label: 'Laatste 90 dagen' },
            { key: 'fdvt-po6', view: 'laatste12maanden', label: 'Laatste 12 maanden' },
            { key: 'fdvt-po7', view: 'ditjaar', label: 'Dit jaar' },
            { key: 'fdvt-po8', view: 'vorigjaar', label: 'Vorig jaar' },
          ]}
          defaultStartDate={new Date(addDays(new Date(), -30).toDateString())}
          defaultEndDate={new Date()}
        />
      </Fieldset>

      {!hidePlaats && (
        <Fieldset title="Plaats">
          <FilteritemGebieden />
        </Fieldset>
      )}

      {filterGebied && (
        <Fieldset title="Zones">
          <FilteritemZones zonesToShow={['custom']} />
        </Fieldset>
      )}

      <FilteritemAanbieders />
    </div>
  );
}

export default FilterbarBeleidszones;
