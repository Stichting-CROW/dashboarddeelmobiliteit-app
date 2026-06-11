import React from 'react';
import './css/FilterbarPermits.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import Fieldset from '../Fieldset/Fieldset';
import FilterbarExtended from './FilterbarExtended.jsx';
import useFilterbarExtended from '../../customHooks/useFilterbarExtended';
import { StateType } from '../../types/StateType';

function FilterbarStatistiek() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openView, close, isViewActive } = useFilterbarExtended();
  const pathname = location.pathname;

  const isBeleidsinfo = pathname === '/stats/beleidsinfo';
  const isPrestatiesAanbieders = pathname === '/stats/prestaties-aanbieders';
  const isBeleidszones = pathname === '/stats/beleidszones';

  const filterGebied = useSelector((state: StateType) =>
    state.filter ? state.filter.gebied : null
  );

  const filterOntwikkelingVan = useSelector((state: StateType) =>
    state.filter && state.filter.ontwikkelingvan
      ? new Date(state.filter.ontwikkelingvan)
      : null
  );

  const filterOntwikkelingTot = useSelector((state: StateType) =>
    state.filter && state.filter.ontwikkelingtot
      ? new Date(state.filter.ontwikkelingtot)
      : null
  );

  const handleSelectDashboardType = (path: string) => {
    const searchParams = new URLSearchParams();
    if (filterGebied) {
      searchParams.set('gm_code', filterGebied);
    }
    // Prestaties aanbieders applies its own default period (last 7 days, excluding today).
    const isPrestatiesAanbiedersPath = path === '/stats/prestaties-aanbieders';
    if (!isPrestatiesAanbiedersPath) {
      if (filterOntwikkelingVan) {
        searchParams.set('start_date', format(filterOntwikkelingVan, 'yyyy-MM-dd'));
      }
      if (filterOntwikkelingTot) {
        searchParams.set('end_date', format(filterOntwikkelingTot, 'yyyy-MM-dd'));
      }
    }
    const queryString = searchParams.toString();
    navigate(queryString ? `${path}?${queryString}` : path);
    close();
  };

  const getCurrentSelection = () => {
    if (isBeleidsinfo) return 'Beleidsinfo';
    if (isPrestatiesAanbieders) return 'Prestaties aanbieders';
    if (isBeleidszones) return 'Hubs en verbodsgebieden';
    return 'Prestaties aanbieders';
  };

  const renderSelectDashboardType = () => (
    <FilterbarExtended
      title="Selecteer statistiek"
      closeFunction={close}
    >
      <div className="filter-form-selectie">
        <div className="filter-form-values">
          <div
            key="item-beleidsinfo"
            className={`form-item ${isBeleidsinfo ? 'form-item-selected' : ''}`}
            onClick={() => handleSelectDashboardType('/stats/beleidsinfo')}
          >
            Beleidsinfo
          </div>
          <div
            key="item-prestaties-aanbieders"
            className={`form-item ${isPrestatiesAanbieders ? 'form-item-selected' : ''}`}
            onClick={() =>
              handleSelectDashboardType('/stats/prestaties-aanbieders')
            }
          >
            Prestaties aanbieders
          </div>
          <div
            key="item-beleidszones"
            className={`form-item ${isBeleidszones ? 'form-item-selected' : ''}`}
            onClick={() => handleSelectDashboardType('/stats/beleidszones')}
          >
            Hubs en verbodsgebieden
          </div>
        </div>
      </div>
    </FilterbarExtended>
  );

  return (
    <Fieldset title="Statistiek">
      <div className="filter-plaats-container">
        <div className="filter-plaats-box-row">
          <div
            className={`filter-plaats-value ${isBeleidsinfo || isPrestatiesAanbieders || isBeleidszones ? '' : 'text-black'}`}
            onClick={() => openView('dashboard-type')}
          >
            {getCurrentSelection()}
          </div>
          {isViewActive('dashboard-type')
            ? renderSelectDashboardType()
            : null}
        </div>
      </div>
    </Fieldset>
  );
}

export default FilterbarStatistiek;
