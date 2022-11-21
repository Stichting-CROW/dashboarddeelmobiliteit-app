import React, {useEffect, useState } from 'react';

import { getOperatorStatsForChart } from './chartTools.js';

import {
  useDispatch,
  useSelector
} from 'react-redux';

import moment from 'moment';

import {
  AreaChart,
  // LineChart,
  Area,
  BarChart,
  Bar,
  // Line,
  XAxis,
  Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {getAggregatedStats, getAggregatedStats_timescaleDB} from '../../api/aggregatedStats';
import {
  getProviderColor,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  sumAggregatedStats,
  doShowDetailledAggregatedData,
  getDateFormat,
  prepareDataForCsv,
  downloadCsv
} from '../../helpers/stats';

import {CustomizedXAxisTick, CustomizedYAxisTick} from '../Chart/CustomizedAxisTick.jsx';
import {CustomizedTooltip} from '../Chart/CustomizedTooltip.jsx';

function BeschikbareVoertuigenChart({filter, config}) {
  const dispatch = useDispatch()

  // Get authentication token
  const token = useSelector(state => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get metadata
  const metadata = useSelector(state => state.metadata)

  // Get all zones
  const zones = useSelector(state => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  // Define state variables
  const [vehiclesData, setVehiclesData] = useState([])

  // On updated filter: re-fetch data
  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;

    async function fetchData() {
      let availableVehicles;
      const options = {
        filter: filter,
        metadata: metadata,
        aggregationLevel: filter.ontwikkelingaggregatie,
        aggregationTime: filter.ontwikkelingaggregatie_tijd,
        aggregationFunction: filter.ontwikkelingaggregatie_function
      }
      if(doShowDetailledAggregatedData(filter, zones)) {
        availableVehicles = await getAggregatedStats_timescaleDB(token, 'available_vehicles', options);
      } else {
        availableVehicles = await getAggregatedStats(token, 'available_vehicles', options);
      }

      // Return if no stats are available
      if(! availableVehicles || (! availableVehicles.availability_stats && ! availableVehicles.available_vehicles_aggregated_stats)) {
        return;
      }
      setVehiclesData(availableVehicles);

      // Sum amount of vehicles per operator, used in FilteritemAanbieders component
      let operators;
      if(availableVehicles && availableVehicles.available_vehicles_aggregated_stats) {
        operators = getOperatorStatsForChart(availableVehicles.available_vehicles_aggregated_stats.values, metadata.aanbieders);
      }
      else {
        operators = getOperatorStatsForChart(availableVehicles.availability_stats.values, metadata.aanbieders);
      }
      dispatch({type: 'SET_OPERATORSTATS_BESCHIKBAREVOERTUIGENCHART', payload: operators });
    
    }
    fetchData();
  }, [filter, filter.ontwikkelingaggregatie, metadata, token, dispatch]);
  
  // On load: get chart data
  const getChartData = () => {
    if(doShowDetailledAggregatedData(filter, zones)) {
      return prepareAggregatedStatsData_timescaleDB('available_vehicles', vehiclesData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude)
    } else {
      return prepareAggregatedStatsData('available_vehicles', vehiclesData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude)
    }
  }

  // Populate chart data
  let chartData = getChartData();
  // 
  const getChartDataWithNiceDates = (data) => {
    const aggregationLevel = filter.ontwikkelingaggregatie;
    const dateFormat = getDateFormat(aggregationLevel);
    return data.map(x => {
      return {...x, ...{ name: moment(x.name).format(dateFormat) }}
    })
  }
  const chartDataWithNiceDates = getChartDataWithNiceDates(chartData)

  if(config && config.sumTotal === true) {
    // chartData = sumAggregatedStats(chartData);
  }
  // console.log(chartData);
  const numberOfPointsOnXAxis = chartData ? Object.keys(chartData).length : 0;

  // Function that renders the chart
  const renderChart = () => {

    // Render area line chart 
    if(numberOfPointsOnXAxis > 24 && filter.ontwikkelingaggregatie !== '15m' && filter.ontwikkelingaggregatie !== '5m' && filter.ontwikkelingaggregatie !== 'hour') {
      return <AreaChart
        data={chartDataWithNiceDates}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 0" vertical={false} />
        <XAxis dataKey="time" tick={<CustomizedXAxisTick />} />
        <YAxis tick={<CustomizedYAxisTick />} />
        <Tooltip content={<CustomizedTooltip />} />
        {config && config.sumTotal === true ? '' : <Legend />}
        {getUniqueProviderNames(chartDataWithNiceDates).map(x => {
          const providerColor = getProviderColor(metadata.aanbieders, x)
          if(x === 'time') return;
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

    // Or render bar chart
    return <BarChart
      data={chartDataWithNiceDates}
      margin={{
        top: 10,
        right: 30,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 0" vertical={false} />
      <XAxis dataKey="time" tick={<CustomizedXAxisTick />} />
      <YAxis tick={<CustomizedYAxisTick />} />
      <Tooltip content={<CustomizedTooltip />} />
      {config && config.sumTotal === true ? '' : <Legend />}
      {getUniqueProviderNames(chartDataWithNiceDates).map(x => {
        const providerColor = getProviderColor(metadata.aanbieders, x)
        if(x === 'time') return;
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
    <div className="relative" style={{ width: '100%', height: '400px' }}>
      {chartData && chartData.length > 0 && <div className="absolute right-0" style={{
        top: '-42px',
        right: '25px'
      }}>
        <button onClick={() => {
          const preparedData = prepareDataForCsv(chartData);
          const filename = `${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}_to_${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}`;
          downloadCsv(preparedData, filename);
        }} className="opacity-50 cursor-pointer">
          <img src="/components/StatsPage/icon-download-to-csv.svg" width="30`" alt="Download to CSV" title="Download to CSV" />
        </button>
      </div>}
      <ResponsiveContainer>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default BeschikbareVoertuigenChart;
