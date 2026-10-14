import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemHerkomstBestemming.css';

import { StateType } from '../../types/StateType';

export default function FilteritemNonOperationalVehicles() {
  const dispatch = useDispatch();

  const showOnlyNonOperationalVehicles = useSelector((state: StateType) => {
    return state.filter ? state.filter.non_operational_only === true : false;
  });

  const setShowOnlyNonOperationalVehicles = (value) => () => {
    dispatch({ type: 'SET_FILTER_NON_OPERATIONAL_ONLY', payload: value });
  };

  let classNameAllVehicles = 'filter-herkomst-bestemming-button';
  let classNameNonOperationalVehicles =
    'filter-herkomst-bestemming-button filter-herkomst-bestemming-button-flex-1';

  if (showOnlyNonOperationalVehicles) {
    classNameNonOperationalVehicles += ' filter-herkomst-bestemming-button-active';
  } else {
    classNameAllVehicles += ' filter-herkomst-bestemming-button-active';
  }

  return (
    <div className="filter-herkomst-bestemming-container">
      <div className="filter-herkomst-bestemming-box-row">
        <div
          className={classNameAllVehicles}
          onClick={setShowOnlyNonOperationalVehicles(false)}
        >
          Alle voertuigen
        </div>
        <div
          className={classNameNonOperationalVehicles}
          onClick={setShowOnlyNonOperationalVehicles(true)}
        >
          Defecte voertuigen
        </div>
      </div>
    </div>
  );
}
