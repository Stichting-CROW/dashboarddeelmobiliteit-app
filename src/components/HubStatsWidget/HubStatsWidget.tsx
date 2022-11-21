import React, {useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import {useLocation} from "react-router-dom";

import moment from 'moment';

import BeschikbareVoertuigenChart from '../Chart/BeschikbareVoertuigenChart.jsx';
import PillMenu from '../PillMenu/PillMenu';

// import {getParkEventsStats} from '../../api/parkEventsStats.js';

// import './HubStatsWidget.css';

import {
  setPublicZoneUrl,
  setAdminZoneUrl,
  getAdminZones,
  // getPublicZones,
  getZoneById,
  sortZonesInPreferedOrder,
  getLocalDrawsOnly,
  getDraftFeatureId,
  fetchAdminZones,
  fetchPublicZones
} from '../Map/MapUtils/zones.js';

function HubStatsWidget(props) {
  const [pathName, setPathName] = useState(null)
  const [publicZones, setPublicZones] = useState(null)
  const [ontwikkelingVan, setOntwikkelingVan] = useState(moment(moment().format('YYYY-MM-DD 00:00')))
  const [ontwikkelingTot, setOntwikkelingTot] = useState(moment(moment().format('YYYY-MM-DD 00:00')).add(1, 'day'))

  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : 0;
  });

  const getPublicZones = async () => {
    const result = await fetchPublicZones(filterGebied);
    setPublicZones(result);
  }

  let location = useLocation();
  useEffect(() => {
    setPathName(location.pathname);
  }, [location.pathname]);

  const filter = useSelector(state => state.filter);

  useEffect(x => {
    getPublicZones();
  }, [filterGebied])

  const getZoneIdFromPath = (pathname) => {
    if(! pathname) return;
    const pathParts = pathname.split('/');
    if(pathParts.length <= 3) return;
    return pathParts[pathParts.length -1];
  }

  const getZoneStats = () => {
    const zoneIdAsString = getZoneIdFromPath(document.location.pathname);
    const getZoneIdAsNumber = (zoneIdAsString) => {
      if(! publicZones) return;
      let foundZoneId;
      publicZones.forEach(x => {
        if(x.geography_id === zoneIdAsString) {
          foundZoneId = x.zone_id;
        }
      })
      return foundZoneId;
    }
    const zoneIdAsNumber = getZoneIdAsNumber(zoneIdAsString)
    if(! zoneIdAsNumber) return false;

    // Set some filter values
    const chartFilter = Object.assign({}, filter, {
      datum: moment().toISOString(),
      ontwikkelingvan: ontwikkelingVan.toISOString(),
      ontwikkelingtot: ontwikkelingTot.toISOString(),
      ontwikkelingaggregatie: 'hour',
      zones: ''+zoneIdAsNumber// Cast to string
    })

    return <div>
      <BeschikbareVoertuigenChart
        filter={chartFilter}
        config={{
          sumTotal: true
        }}
        />
    </div>
  }

  const chartArrows = [
    {
      title: '<',
      link: () => {
        setOntwikkelingVan(ontwikkelingVan.subtract(1, 'day'))
        setOntwikkelingTot(ontwikkelingTot.subtract(1, 'day'))
      }
    },
    {
      title: '>',
      link: () => {
        setOntwikkelingVan(ontwikkelingVan.add(1, 'day'))
        setOntwikkelingTot(ontwikkelingTot.add(1, 'day'))
      }
    }
  ];

  const zoneStatsDiv = getZoneStats();
  if(! zoneStatsDiv) return <div/>

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
        
        {zoneStatsDiv}

        <div className={"agg-button-container justify-center mt-4 mb-2"}>
          {chartArrows.map(x => {
            return <div
              key={x.title}
              className="agg-button"
              onClick={x.link}
              >
              {x.title}
            </div>
          })}
        </div>

        <div className="mb-2 text-center">
          {moment(ontwikkelingVan).format('dddd')}
        </div>

      </div>
    </SlideBox>
  )
}

export {
  HubStatsWidget
}
