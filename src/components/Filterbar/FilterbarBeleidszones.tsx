import React, { useEffect, useRef } from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';

import { useSelector, useDispatch, useStore } from 'react-redux';
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

/** `gm_code` / `zones` values as last seen in the URL by the sync effect. */
interface SyncSnapshot {
  urlGebied: string;
  urlZones: string;
}

const BELEIDSZONES_PATH = '/stats/beleidszones';

function FilterbarBeleidszones({ hideLogo }: FilterbarBeleidszonesProps) {
  const dispatch = useDispatch();
  const store = useStore<StateType>();
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

  // URL values as last seen by the sync effect. Lets us detect whether the URL
  // changed since the previous run (and therefore is the source of truth).
  const lastSyncedRef = useRef<SyncSnapshot | null>(null);

  /**
   * Keep `gm_code` / `zones` in the URL and Redux in sync.
   *
   * This is intentionally a single effect. Two separate effects (URL -> Redux
   * on `location.search`, Redux -> URL on `filterZones`) could fire in the
   * same commit with different values and keep overwriting each other, which
   * caused an endless redirect loop between the URL zone and the Redux zone.
   *
   * Rules:
   * - If the URL params changed (navigation, back/forward): URL wins. A param
   *   that is absent from the URL has no opinion, so Redux is written to the
   *   URL for it instead.
   * - Otherwise (user picked in the filterbar): the URL follows Redux.
   *
   * Redux values are read from the store rather than from the closure so a
   * re-run with a stale closure (e.g. StrictMode) never pushes an outdated
   * value back to the URL. `filterGebied` / `filterZones` are only deps so
   * that Redux changes trigger this effect.
   */
  useEffect(() => {
    if (location.pathname !== BELEIDSZONES_PATH) return;

    const params = new URLSearchParams(location.search);
    const urlGebied = params.get('gm_code') ?? '';
    const urlZones = (params.get('zones') ?? '').trim();

    const liveFilter = store.getState().filter;
    const reduxGebied = liveFilter?.gebied ? String(liveFilter.gebied) : '';
    const reduxZones = liveFilter?.zones ? String(liveFilter.zones).trim() : '';

    const prev = lastSyncedRef.current;
    const urlChanged =
      !prev || prev.urlGebied !== urlGebied || prev.urlZones !== urlZones;

    // What Redux will hold after this effect; the URL is derived from this.
    let nextGebied = reduxGebied;
    let nextZones = reduxZones;

    if (urlChanged) {
      if (urlGebied && urlGebied !== reduxGebied) {
        dispatch({ type: 'SET_FILTER_GEBIED', payload: urlGebied });
        nextGebied = urlGebied;
        // The reducer clears the zones when the gebied changes.
        nextZones = '';
      }
      if (urlZones && urlZones !== nextZones) {
        dispatch({ type: 'SET_FILTER_ZONES', payload: urlZones });
        nextZones = urlZones;
      }
    }

    if (nextGebied) {
      params.set('gm_code', nextGebied);
    } else {
      params.delete('gm_code');
    }
    if (nextZones) {
      params.set('zones', nextZones);
    } else {
      params.delete('zones');
    }

    lastSyncedRef.current = { urlGebied: nextGebied, urlZones: nextZones };

    const newSearch = params.toString();
    const currentSearch = location.search ? location.search.slice(1) : '';
    if (newSearch !== currentSearch) {
      navigate(`${BELEIDSZONES_PATH}${newSearch ? `?${newSearch}` : ''}`, {
        replace: true
      });
    }
  }, [
    location.pathname,
    location.search,
    filterGebied,
    filterZones,
    store,
    dispatch,
    navigate
  ]);

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
          <FilteritemZones
            zonesToShow={['custom']}
            showGeographyTypeFilter={true}
          />
        </Fieldset>
      )}

      <FilteritemAanbieders />
    </div>
  );
}

export default FilterbarBeleidszones;
