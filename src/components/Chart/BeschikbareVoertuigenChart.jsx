import React, {useEffect, useState } from 'react';

import {
  // useDispatch,
  useSelector
} from 'react-redux';

// import moment from 'moment';

import {
  AreaChart,
  LineChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {getAggregatedStats} from '../../api/aggregatedStats';
import {
  getProviderColor,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {prepareAggregatedStatsData} from '../../helpers/stats.js';

import {CustomizedXAxisTick, CustomizedYAxisTick} from '../Chart/CustomizedAxisTick.jsx';
import {CustomizedTooltip} from '../Chart/CustomizedTooltip.jsx';

function BeschikbareVoertuigenChart(props) {
  // const dispatch = useDispatch()

  const token = useSelector(state => (state.authentication.user_data && state.authentication.user_data.token)||null)
  const filter = useSelector(state => state.filter)
  const metadata = useSelector(state => state.metadata)

  const [vehiclesData, setVehiclesData] = useState([])

  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;
    async function fetchData() {
      const availableVehicles = await getAggregatedStats(token, 'available_vehicles', {
        filter: filter,
        metadata: metadata,
        aggregationLevel: filter.ontwikkelingaggregatie
      });
      setVehiclesData(prepareAggregatedStatsData('available_vehicles', availableVehicles, filter.ontwikkelingaggregatie));
    }
    fetchData();
  }, [filter, filter.ontwikkelingaggregatie, metadata, token]);
  
  const numberOfPointsOnXAxis = vehiclesData ? Object.keys(vehiclesData).length : 0;

  const renderChart = () => {
    if(numberOfPointsOnXAxis > 12) {
      return <AreaChart
        data={vehiclesData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 0" vertical={false} />
        <XAxis dataKey="name" tick={<CustomizedXAxisTick />} />
        <YAxis tick={<CustomizedYAxisTick />} />
        <Tooltip content={<CustomizedTooltip />} />
        <Legend />
        {getUniqueProviderNames(vehiclesData[0]).map(x => {
          const providerColor = getProviderColor(metadata.aanbieders, x)
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
    }

    return <BarChart
      data={vehiclesData}
      margin={{
        top: 10,
        right: 30,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 0" vertical={false} />
      <XAxis dataKey="name" tick={<CustomizedXAxisTick />} />
      <YAxis tick={<CustomizedYAxisTick />} />
      <Tooltip content={<CustomizedTooltip />} />
      <Legend />
      {getUniqueProviderNames(vehiclesData[0]).map(x => {
        const providerColor = getProviderColor(metadata.aanbieders, x)
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

  return (
    <div style={{ width: '100%', height: '400px', overflowX: 'hidden', overflowY: 'hidden' }}>
      <ResponsiveContainer>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default BeschikbareVoertuigenChart;
