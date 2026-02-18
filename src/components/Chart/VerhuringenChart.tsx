import React, {useEffect, useState } from 'react';

import { getOperatorStatsForChart } from './chartTools.js';

import {StateType} from '../../types/StateType';

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

import {
  getAggregatedStats
} from '../../api/aggregatedStats';
import {
  getProviderColor,
  getPrettyProviderName,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  sumAggregatedStats,
  doShowDetailledAggregatedData,
  prepareDataForCsv,
  downloadCsv,
  getDateFormat,
  getAggregatedRentalsData,
  getAggregatedRentalsChartData
} from '../../helpers/stats/index';

import {CustomizedXAxisTick, CustomizedYAxisTick} from '../Chart/CustomizedAxisTick.jsx';
import {CustomizedTooltip} from '../Chart/CustomizedTooltip.jsx';
import InfoTooltip from '../InfoTooltip/InfoTooltip';

function VerhuringenChart(props) {
  const dispatch = useDispatch()

  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)
  const filter = useSelector((state: StateType) => state.filter)
  const metadata = useSelector((state: StateType) => state.metadata)

  const aanbieders = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });

  // Get all zones
  const zones = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  const [rentalsData, setRentalsData] = useState([])

  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;
    async function fetchData() {
      // Get aggregated vehicle data
      const aggregatedData = await getAggregatedRentalsData(token, filter, zones, metadata);
      if(! aggregatedData) return;

      // Set state
      setRentalsData(aggregatedData);

      // Sum amount of vehicles per operator, used in FilteritemAanbieders component
      let operators;
      if(aggregatedData && aggregatedData.rentals_aggregated_stats) {
        operators = getOperatorStatsForChart(aggregatedData.rentals_aggregated_stats.values, metadata.aanbieders);
      }
      else {
        operators = getOperatorStatsForChart(aggregatedData.rental_stats.values, metadata.aanbieders);
      }
      dispatch({type: 'SET_OPERATORSTATS_VERHURINGENCHART', payload: operators });
    }
    fetchData();
  }, [
    filter.ontwikkelingvan,
    filter.ontwikkelingtot,
    filter.ontwikkelingaggregatie,
    filter.ontwikkelingaggregatie_function,
    filter.zones,
    metadata,
    token,
    dispatch
  ]);
  
  // Populate chart data
  const chartData = getAggregatedRentalsChartData(rentalsData, filter, zones, aanbieders);

  const getChartDataWithNiceDates = (data) => {
    const aggregationLevel = filter.ontwikkelingaggregatie;
    const dateFormat = getDateFormat(aggregationLevel);
    return data.map(x => {
      return {...x, ...{ time: moment(x.time ? x.time : x.name).format(dateFormat) }}
    })
  }
  const chartDataWithNiceDates = getChartDataWithNiceDates(chartData)

  const setAggregationFunction = (value) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE_FUNCTION',
      payload: value
    })
  }

  const renderAggregationFunctionButton = (name, title) => {
    return (
      <div key={`agg-level-`+name} className={"agg-button " + (filter.ontwikkelingaggregatie_function === name ? " agg-button-active":"")} onClick={() => { setAggregationFunction(name) }}>
        {title}
      </div>
    )
  }

  const numberOfPointsOnXAxis = rentalsData ? Object.keys(rentalsData).length : 0;

  const renderChart = () => {
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
        <Legend />
        {getUniqueProviderNames(chartDataWithNiceDates).map(x => {
          const providerColor = getProviderColor(metadata.aanbieders, x)
          if(x === 'time') return;
          return (
            <Area
              key={x}
              stackId="1"
              type="monotone"
              dataKey={x}
              name={getPrettyProviderName(x)}
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
      <Legend></Legend>
      {getUniqueProviderNames(chartDataWithNiceDates).map(x => {
        const providerColor = getProviderColor(metadata.aanbieders, x)
        if(x === 'time') return;
        return (
          <Bar
            key={x}
            stackId="1"
            type="monotone"
            dataKey={x}
            name={getPrettyProviderName(x)}
            stroke={providerColor}
            fill={providerColor}
            isAnimationActive={false}
          />
        )
      })}
    </BarChart>
  }

  return (
    <div className="relative">

      <div className="flex justify-between my-2">
        <div className="flex flex-start">

          {props.title && <h2 className="text-4xl my-2">
            {props.title}
          </h2>}

          {chartData && chartData.length > 0 && <div className="flex justify-center flex-col ml-2">
            <button onClick={() => {
              const preparedData = prepareDataForCsv(chartData);
              const filename = `${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}_to_${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}`;
              downloadCsv(preparedData, filename);
            }} className="opacity-50 cursor-pointer">
              <img src="/components/StatsPage/icon-download-to-csv.svg" width="30`" alt="Download to CSV" title="Download to CSV" />
            </button>
          </div>}

        </div>

        {false && doShowDetailledAggregatedData(filter, zones) && <div className={"text-sm flex flex-col justify-center"}>
          <div className="flex">
            {doShowDetailledAggregatedData(filter, zones) && (
              <InfoTooltip className="mx-2 inline-block">
                Zie in ieder tijdsinterval wat het totaal aantal verhuringen was in dat interval.
              </InfoTooltip>
            )}
          </div>
        </div>}

      </div>

      <div className="relative" style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default VerhuringenChart;
