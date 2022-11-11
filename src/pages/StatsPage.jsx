import React, {useEffect} from 'react'; // , {useEffect, useState }
import './StatsPage.css'

import {
  useDispatch,
  useSelector
} from 'react-redux';

import moment from 'moment';

import {
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone
} from '../helpers/stats.js';

import VerhuringenChart from '../components/Chart/VerhuringenChart.jsx';
import BeschikbareVoertuigenChart from '../components/Chart/BeschikbareVoertuigenChart.jsx';
import FormInput from '../components/FormInput/FormInput';

function StatsPage(props) {
  const dispatch = useDispatch()

  const filter = useSelector(state => state.filter);

  const zones = useSelector(state => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  const filterZones = useSelector(state => {
    return state.filter ? state.filter.zones : 0;
  });

  const setAggregationLevel = (newlevel) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    })
  }

  // Function that chooses a preferred default aggregation level
  const decideOnAggregationLevel = (userDidSelectCustomZone) => {
    // Default aggragation level
    let agg = null;
    // Count days
    const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(moment(filter.ontwikkelingvan), 'days');
    // If custom zone:
    if(userDidSelectCustomZone) {
      if(daysInSelectedPeriod <= 1 && false) agg = '5m';
      else if(daysInSelectedPeriod <= 2) agg = '15m';
      else if(daysInSelectedPeriod <= 5) agg = 'hour';
    }
    // If no custom zone:
    else {
      const detailledAggLevels = ['5m', '15m', 'hour'];
      // If agg level is specific to detailled agg data: switch to other agg level
      if(detailledAggLevels.indexOf(filter.ontwikkelingaggregatie) > -1) {
        // Switch to non-detailled agg level
        agg = 'day';
      }
    }
    return agg;
  }

  // Monitor if selected zones change
  useEffect(() => {
    const userDidSelectCustomZone = didSelectAtLeastOneCustomZone(filter, zones);
    const agg = decideOnAggregationLevel(userDidSelectCustomZone);
    if(agg) setAggregationLevel(agg);
  }, [filterZones])

  const setAggregationTime = (newtime) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_TIJD',
      payload: newtime
    })
  }

  const setAggregationFunction = (value) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_FUNCTION',
      payload: value
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

  const renderAggregationFunctionButton = (name, title) => {
    return (
      <div
        key={`agg-level-${name}`}
        className={"agg-button " + (filter.ontwikkelingaggregatie_function===name ? " agg-button-active":"")}
        onClick={() => { setAggregationFunction(name) }}
      >
        {title}
      </div>
    )
  }

  const daysInSelectedPeriod = moment(filter.ontwikkelingtot).diff(moment(filter.ontwikkelingvan), 'days');

  let aggregationButtonsToRender = [];
  if(doShowDetailledAggregatedData(filter, zones)) {
    const doShow5m = daysInSelectedPeriod <= 1;
    const doShow15m = daysInSelectedPeriod <= 2;
    const doShowHour = daysInSelectedPeriod <= 5;

    if(doShow5m) {
      aggregationButtonsToRender.push(
        {name: '5m', title: '5 min'},
      );
    }
    if(doShow15m) {
      aggregationButtonsToRender.push(
        {name: '15m', title: 'kwartier'},
      );
    }
    if(doShowHour) {
      aggregationButtonsToRender.push(
        {name: 'hour', title: 'uur'}
      );
    }
  }
  aggregationButtonsToRender.push(
    {name: 'day', title: 'dag'},
  );
  if(daysInSelectedPeriod >= 6) {
    aggregationButtonsToRender.push(
      {name: 'week', title: 'week'},
    );
  }
  if(daysInSelectedPeriod >= 27) {
    aggregationButtonsToRender.push(
      {name: 'month', title: 'maand'},
    );
  }
  
  const aggregationFunctionButtonsToRender = [
    {name: 'MIN', title: 'min'},
    {name: 'AVG', title: 'gemiddeld'},
    {name: 'MAX', title: 'max'},
  ];

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

            {doShowDetailledAggregatedData(filter, zones) && <div className={"text-sm flex flex-col justify-center"}>
              <div className="flex">
                {aggregationFunctionButtonsToRender.map(x => renderAggregationFunctionButton(x.name, x.title))}
              </div>
            </div>}

            {filter.ontwikkelingaggregatie === 'day' ? renderTimeControl() : ''}

          </div>
          <BeschikbareVoertuigenChart
            filter={filter}
            />
        </div>
      </div>

    </div>
  )
}

export default StatsPage;
