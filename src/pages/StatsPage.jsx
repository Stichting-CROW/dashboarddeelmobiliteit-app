import React from 'react'; // , {useEffect, useState }
import './StatsPage.css'

import {
  useDispatch,
  useSelector
} from 'react-redux';

import VerhuringenChart from '../components/Chart/VerhuringenChart.jsx';
import BeschikbareVoertuigenChart from '../components/Chart/BeschikbareVoertuigenChart.jsx';

function StatsPage(props) {
  const dispatch = useDispatch()

  const filter = useSelector(state => state.filter)

  const setAggregationLevel = (newlevel) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    })
  }

  return (
    <div className="StatsPage pt-4 pb-24">

      <div className={"agg-button-container"}>
        <div className={"agg-button " + (filter.ontwikkelingaggregatie==='day' ? " agg-button-active":"")} onClick={() => { setAggregationLevel('day') }}>
          dag
        </div>
        <div className={"agg-button " + (filter.ontwikkelingaggregatie==='week' ? " agg-button-active":"")} onClick={() => { setAggregationLevel('week') }}>
          week
        </div>
        <div className={"agg-button " + (filter.ontwikkelingaggregatie==='month' ? " agg-button-active":"")} onClick={() => { setAggregationLevel('month') }}>
          maand
        </div>
      </div>

      <div className="xl:flex">
        <div className="xl:flex-1">
          <h2 className="text-4xl my-2">Verhuringen</h2>
          <VerhuringenChart />
        </div>
        <div className="xl:flex-1">
          <h2 className="text-4xl my-2">Beschikbare voertuigen</h2>
          <BeschikbareVoertuigenChart />
        </div>
      </div>

    </div>
  )
}

export default StatsPage;
