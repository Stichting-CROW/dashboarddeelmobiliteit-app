import React from 'react'; // , {useEffect, useState }
import './StatsPage.css'

import {
  useDispatch,
  useSelector
} from 'react-redux';

import VerhuringenChart from '../components/Chart/VerhuringenChart.jsx';
import BeschikbareVoertuigenChart from '../components/Chart/BeschikbareVoertuigenChart.jsx';
import FormInput from '../components/FormInput/FormInput';

function StatsPage(props) {
  const dispatch = useDispatch()

  const filter = useSelector(state => state.filter)

  const setAggregationLevel = (newlevel) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    })
  }

  const setAggregationTime = (newtime) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_TIJD',
      payload: newtime
    })
  }

  const renderTimeControl = () => {
    return  (
      <div className="StatsPage-time-selection flex justify-center flex-col">
        <FormInput
          name="time"
          type="time"
          value={filter.ontwikkelingaggregatie_tijd}
          onChange={(e) => {
            setAggregationTime(e.target.value)
          }}
        />
      </div>
    )
  }

  const renderAggregationButton = (name, title) => {
    return (
      <div
        key={`agg-level-${name}`}
        className={"agg-button " + (filter.ontwikkelingaggregatie===name ? " agg-button-active":"")}
        onClick={() => { setAggregationLevel(name) }}
      >
        {title}
      </div>
    )
  }

  const aggregationButtonsToRender = [
    {name: 'minute', title: 'minuut'},
    {name: 'hour', title: 'uur'},
    {name: 'day', title: 'dag'},
    {name: 'week', title: 'week'},
    {name: 'month', title: 'maand'},
  ]

  return (
    <div className="StatsPage pt-4 pb-24">

      <div className={"agg-button-container"}>
        {aggregationButtonsToRender.map(x => renderAggregationButton(x.name, x.title))}
      </div>

      <div className="xl:flex">
        <div className="xl:flex-1 mt-8 xl:mt-0">
          <div className="flex justify-between">
            <h2 className="text-4xl my-2">Verhuringen</h2>
            {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}
          </div>
          <VerhuringenChart />
        </div>
        <div className="xl:flex-1 mt-8 xl:mt-0">
          <div className="flex justify-between">
            <h2 className="text-4xl my-2">Beschikbare voertuigen</h2>
            {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}
          </div>
          <BeschikbareVoertuigenChart />
        </div>
      </div>

    </div>
  )
}

export default StatsPage;
