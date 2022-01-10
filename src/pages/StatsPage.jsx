import React, {useEffect, useState } from 'react';
import './StatsPage.css'

import {
  useDispatch,
  useSelector
} from 'react-redux';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {getAggregatedStats} from '../api/aggregatedStats';
import {
  getProviderColor,
  getUniqueProviderNames
} from '../helpers/providers.js';
import {
  prepareAggregatedStatsData,
} from '../helpers/stats.js';

import VerhuringenChart from '../components/Chart/VerhuringenChart.jsx';
import BeschikbareVoertuigenChart from '../components/Chart/BeschikbareVoertuigenChart.jsx';
import ParkeerduurChart from '../components/Chart/ParkeerduurChart.jsx';

import {CustomizedXAxisTick, CustomizedYAxisTick} from '../components/Chart/CustomizedAxisTick.jsx';

const renderStackedAreaChart = (data, providers) => {
  return (
    <div style={{ width: '100%', height: '400px', overflowX: 'auto', overflowY: 'hidden' }}>
      <ResponsiveContainer>
        <AreaChart
          height={400}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" height={100} tick={<CustomizedXAxisTick />} />
          <YAxis tick={<CustomizedYAxisTick />} />
          <Tooltip />
          {getUniqueProviderNames(data[0]).map(x => {
            const providerColor = getProviderColor(providers, x)
            return (
              <Area
                key={x}
                stackId="1"
                type="monotone"
                dataKey={x}
                stroke={providerColor}
                fill={providerColor}
                isAnimationActive={false}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const renderStackedBarChart = (data, providers) => {
  return <BarChart
    width={800}
    height={400}
    data={data}
    margin={{
      top: 20,
      right: 30,
      left: 20,
      bottom: 5,
    }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    {getUniqueProviderNames(data[0]).map(x => {
      const providerColor = getProviderColor(providers, x)
      return (
        <Bar
          key={x}
          stackId="1"
          type="monotone"
          dataKey={x}
          stroke={providerColor}
          fill={providerColor}
          isAnimationActive={false}
        />
      )
    })}
  </BarChart>
}

function StatsPage(props) {
  const dispatch = useDispatch()

  const token = useSelector(state => state.authentication.user_data.token)
  const filter = useSelector(state => state.filter)
  const metadata = useSelector(state => state.metadata)

  const setAggregationLevel = (newlevel) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    })
  }

  return (
    <div className="StatsPage">

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

      {/*<div className="xl:flex">
        <div className="xl:flex-1">
          <h2 className="text-4xl my-2">Parkeerduur</h2>
          <ParkeerduurChart />
        </div>
        <div className="xl:flex-1">
          <h2 className="text-4xl my-2">Gemiddeld aantal verhuringen per voertuig per dag</h2>
          <AantalVerhuringenPerVoertuigPerDagChart />
        </div>
      </div>*/}

      {/*Meer dan 12 datapunten: lijn, anders bar.*/}

    </div>
  )
}

export default StatsPage;
