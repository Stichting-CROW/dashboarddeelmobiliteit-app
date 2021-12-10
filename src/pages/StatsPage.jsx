import React, {useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
// import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { AreaChart, Area, BarChart, Bar, XAxis, Legend, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import {getAggregatedStats} from '../api/aggregatedStats';

// import './StatsPagePage.css';

const prepareData = (key, data) => {
  if(! data || ! data[`${key}_aggregated_stats`] || ! data[`${key}_aggregated_stats`].values) {
    return [];
  }
  return data[`${key}_aggregated_stats`].values.map(x => {
    const { start_interval, ...rest } = x;
    return {...rest, ...{ name: moment(start_interval).format('YYYY-MM-DD') }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
  });
}

const getUniqueProviderNames = (object) => {
  if(! object) return [];
  return Object.keys(object).filter((key, val) => {
    return key != 'name' ? key : false;
  })
}

const getProviderColor = (providers, providerName) => {
  const found = providers.filter(x => {
    return x.system_id == providerName;
  });
  return found && found[0] ? found[0].color : '#8884d8';
}

const renderStackedAreaChart = (data, providers) => {
  return <AreaChart
    width={800}
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
    <XAxis dataKey="name" />
    <YAxis />
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
        />
      )
    })}
  </AreaChart>
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
        />
      )
    })}
  </BarChart>
}

function StatsPage(props) {
  const token = useSelector(state => state.authentication.user_data.token)
  const filter = useSelector(state => state.filter)
  const metadata = useSelector(state => state.metadata)

  const [vehiclesData, setVehiclesData] = useState([])
  const [rentalsData, setRentalsData] = useState([])
  const [aggregationLevel, setAggregationLevel] = useState('month')

  useEffect(async () => {
    const availableVehicles = await getAggregatedStats(token, 'available_vehicles', {
      filter: filter,
      metadata: metadata,
      aggregationLevel: aggregationLevel
    });
    setVehiclesData(prepareData('available_vehicles', availableVehicles));
    const rentals = await getAggregatedStats(token, 'rentals', {
      filter: filter,
      metadata: metadata,
      aggregationLevel: aggregationLevel
    });
    setRentalsData(prepareData('rentals', rentals));
  }, [aggregationLevel]);

  return (
    <div>
      <button className="mx-2" onClick={() => { setAggregationLevel('day') }}>
        day
      </button>
      <button className="mx-2" onClick={() => { setAggregationLevel('week') }}>
        week
      </button>
      <button className="mx-2" onClick={() => { setAggregationLevel('month') }}>
        month
      </button>
      <h1 className="text-4xl my-2">Beschikbare voertuigen</h1>
      {renderStackedAreaChart(vehiclesData, metadata.aanbieders)}
      {renderStackedBarChart(vehiclesData, metadata.aanbieders)}
      <h1 className="text-4xl my-2">Verhuringen</h1>
      {renderStackedAreaChart(rentalsData, metadata.aanbieders)}
      {renderStackedBarChart(rentalsData, metadata.aanbieders)}
    </div>
  )
}

export default StatsPage;
