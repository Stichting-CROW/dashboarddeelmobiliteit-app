import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { StateType } from '../../types/StateType';
import { isNearRealtime } from '../../poll-api/pollTools.js';

/**
 * Small textual toggle "Mijn gebied | Heel NL" (Aanbod map, logged-in users)
 * to switch between only the vehicles in the user's own data area and all
 * vehicles in the Netherlands. The active option is underlined.
 * Vehicles outside the own data area are only available for (near) realtime.
 */
function FilteritemShowAllNlVehicles() {
  const dispatch = useDispatch();

  const showAllNlVehiclesSetting = useSelector((state: StateType) => {
    return state.filter ? state.filter.show_all_nl_vehicles !== false : true;
  });

  const filterDatum = useSelector((state: StateType) => {
    return state.filter ? state.filter.datum : null;
  });

  const isRealtime = isNearRealtime(filterDatum);
  const showAllNlVehicles = isRealtime && showAllNlVehiclesSetting;

  const setShowAllNlVehicles = useCallback((value: boolean) => {
    dispatch({ type: 'SET_FILTER_SHOW_ALL_NL_VEHICLES', payload: value });
  }, [dispatch]);

  const optionClassName = (isActive: boolean) => (isActive
    ? 'underline text-gray-800'
    : 'text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed');

  return (
    <span
      className="text-xs text-gray-500 whitespace-nowrap"
      title={isRealtime
        ? undefined
        : 'Voertuigen buiten je eigen datagebied zijn alleen beschikbaar voor de huidige datum/tijd.'}
    >
      <button
        type="button"
        className={optionClassName(!showAllNlVehicles)}
        aria-pressed={!showAllNlVehicles}
        onClick={() => setShowAllNlVehicles(false)}
        title="Toon alleen de voertuigen in je eigen datagebied"
      >
        Mijn gebied
      </button>
      {' | '}
      <button
        type="button"
        className={optionClassName(showAllNlVehicles)}
        aria-pressed={showAllNlVehicles}
        onClick={() => setShowAllNlVehicles(true)}
        disabled={!isRealtime}
        title={isRealtime
          ? 'Toon alle voertuigen in Nederland. Details zoals parkeerduur zijn er alleen voor je eigen datagebied.'
          : undefined}
      >
        Heel NL
      </button>
    </span>
  );
}

export default FilteritemShowAllNlVehicles;
