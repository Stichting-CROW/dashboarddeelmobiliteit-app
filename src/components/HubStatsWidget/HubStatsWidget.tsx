import React, {useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import {useLocation} from "react-router-dom";

import {StateType} from '../../types/StateType';

import moment from 'moment';

import BeschikbareVoertuigenChart from '../Chart/BeschikbareVoertuigenChart.jsx';

import {
  fetchPublicZones
} from '../Map/MapUtils/zones.js';

function HubStatsWidget({
  zone_id
}) {
  const [counter, setCounter] = useState(0)
  const [publicZones, setPublicZones] = useState(null)
  const [ontwikkelingVan, setOntwikkelingVan] = useState(moment(moment().format('YYYY-MM-DD 00:00')))
  const [ontwikkelingTot, setOntwikkelingTot] = useState(moment(moment().format('YYYY-MM-DD 00:00')))

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : 0;
  });

  const getPublicZones = async () => {
    const result = await fetchPublicZones(filterGebied);
    setPublicZones(result);
  }

  const filter = useSelector((state: StateType) => state.filter);

  useEffect(() => {
    getPublicZones();
  }, [filterGebied])

  const getZoneStats = (zone_id) => {
    const zoneIdAsNumber = parseInt(zone_id);
    if(! zoneIdAsNumber) return false;

    // Set some filter values
    const chartFilter = Object.assign({}, filter, {
      ontwikkelingvan: ontwikkelingVan.format(),
      ontwikkelingtot: ontwikkelingTot.format(),
      ontwikkelingaggregatie: 'hour',
      zones: ''+zoneIdAsNumber// Cast to string
    });

    return <div>
      <BeschikbareVoertuigenChart
        filter={chartFilter}
        config={{
          height: '200px',
          sumTotal: true
        }}
        />
    </div>
  }

  const chartArrows = [
    {
      title: '<',
      link: () => {
        const newOntwikkelingVan = ontwikkelingVan.subtract(1, 'day');
        const newOntwikkelingTot = ontwikkelingTot.subtract(1, 'day');
        setOntwikkelingVan(newOntwikkelingVan)
        setOntwikkelingTot(newOntwikkelingTot)
        setCounter(counter+1);
      }
    },
    {
      title: '>',
      link: () => {
        const newOntwikkelingVan = ontwikkelingVan.add(1, 'day');
        const newOntwikkelingTot = ontwikkelingTot.add(1, 'day');
        setOntwikkelingVan(newOntwikkelingVan)
        setOntwikkelingTot(newOntwikkelingTot)
        setCounter(counter+1);
      }
    }
  ];

  const zoneStatsDiv = getZoneStats(zone_id);
  if(! zoneStatsDiv) return <div/>

  return (
    <div className="HubStatsWidget px-2 py-2">
      
      {zoneStatsDiv}

      <div className={"agg-button-container justify-center mt-4 mb-2"}>
        {chartArrows.map(x => {
          // Don't show '>' if it's in the future
          if(x.title === '>' && (ontwikkelingTot.unix()+86400) > moment().unix()) {
            return;
          }
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
  )
}

export {
  HubStatsWidget
}
