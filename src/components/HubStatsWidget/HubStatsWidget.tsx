import React, {useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import {useLocation} from "react-router-dom";

import moment from 'moment';

import BeschikbareVoertuigenChart from '../Chart/BeschikbareVoertuigenChart.jsx';

// import {getParkEventsStats} from '../../api/parkEventsStats.js';

// import './HubStatsWidget.css';

function HubStatsWidget(props) {
  const [pathName, setPathName] = useState(null)

  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);

  const filter = useSelector(state => state.filter);

  const getZoneIdFromPath = (pathname) => {
    if(! pathname) return;
    const pathParts = pathname.split('/');
    if(pathParts.length <= 3) return;
    return pathParts[pathParts.length -1];
  }

  const getZoneStats = () => {
    const zoneId = getZoneIdFromPath(document.location.pathname);

    // Set some filter values
    const chartFilter = Object.assign({}, filter, {
      datum: moment().toISOString(),
      ontwikkelingvan: moment('YYYY-MM-DD 00:00').subtract('1', 'days').toISOString(),
      ontwikkelingtot: moment('YYYY-MM-DD 00:00').add(1, 'day').toISOString(),
      ontwikkelingaggregatie: '15m',
      zones: '51234'
    })

    return <div>
      {zoneId}
      <BeschikbareVoertuigenChart
        filter={chartFilter}
        />
    </div>
  }

  return (
    <SlideBox name="HubStatsWidget" direction="right" options={{
      title: 'Hub',
      backgroundColor: '#fff',
    }} style={{
      position: 'absolute',
      top: '125px',
      right: 0
    }}>
      <div className="HubStatsWidget px-2 py-2" style={{minWidth: '356px', minHeight: '105px'}}>
        {getZoneStats()}
      </div>
    </SlideBox>
  )
}

export {
  HubStatsWidget
}
