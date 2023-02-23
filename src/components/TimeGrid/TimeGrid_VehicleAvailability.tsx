import React, {useEffect, useState } from 'react';
import {
  useDispatch,
  useSelector
} from 'react-redux';
import moment from 'moment';

import {StateType} from '../../types/StateType';

import {
  getAggregatedVehicleData,
} from '../../helpers/stats/index';

import {
  getTotalsPerHour,
  getSummedTotalsPerWeekdayAndHour
} from '../../helpers/stats/parking-data';

import TimeGrid from './TimeGrid';

import {themes} from '../../themes';

function TimeGrid_VehicleAvailability({
}) {

  const dispatch = useDispatch()

  // Get redux state vars
  const filter = useSelector((state: StateType) => state.filter);
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)
  const metadata = useSelector((state: StateType) => state.metadata)
  const zones = useSelector((state: StateType) => { return (state.metadata && state.metadata.zones) ? state.metadata.zones : []; });

  // Define local state variables
  const [totalsPerWeekdayAndHour, setTotalsPerWeekdayAndHour] = useState([])

  async function fetchData() {
    const customFilter = Object.assign({}, filter, {
      ontwikkelingaggregatie: 'hour'
    });

    // Get aggregated vehicle data
    const aggregatedVehicleData = await getAggregatedVehicleData(
      token,
      customFilter,
      zones,
      metadata
    );
    // Set state
    // setVehiclesData(aggregatedVehicleData);
    return aggregatedVehicleData;
  }
  useEffect(() => {
    (async () => {
      const vehicleData = await fetchData();
      if(! vehicleData) return;
      const totals = getTotalsPerHour(vehicleData.availability_stats.values);
      const aggregatedTotals = getSummedTotalsPerWeekdayAndHour(totals);
      setTotalsPerWeekdayAndHour(aggregatedTotals);
    })();
  }, [
    filter.ontwikkelingvan,
    filter.ontwikkelingtot,
    filter.ontwikkelingaggregatie_function,
    filter.zones,
    metadata,
    token
  ]);

  return <div className="TimeGrid_VehicleAvailability">
    <TimeGrid data={totalsPerWeekdayAndHour} />
  </div>
}

export default TimeGrid_VehicleAvailability;
