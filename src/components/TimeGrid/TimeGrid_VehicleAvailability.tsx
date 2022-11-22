import React, {useEffect, useState } from 'react';
import {
  useDispatch,
  useSelector
} from 'react-redux';
import moment from 'moment';

import TimeGrid from './TimeGrid';

import {themes} from '../../themes';

function TimeGrid_VehicleAvailability({
}) {


  return <div className="TimeGrid_VehicleAvailability">
    TIMEGRID VEHICLE AVAILABILITY
    <TimeGrid />
  </div>
}

export default TimeGrid_VehicleAvailability;
