import React, {useEffect, useState } from 'react';

import { getOperatorStatsForChart } from './chartTools.js';

import {StateType} from '../../types/StateType.js';

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

import {getAggregatedStats, getAggregatedStats_timescaleDB} from '../../api/aggregatedStats.js';
import {
  getProviderColor,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  sumAggregatedStats,
  doShowDetailledAggregatedData,
  didSelectAtLeastOneCustomZone,
  aggregationFunctionButtonsToRender,
  getDateFormat,
  prepareDataForCsv,
  downloadCsv,
  getAggregatedVehicleData,
  getAggregatedChartData
} from '../../helpers/stats/index';

import {CustomizedXAxisTick, CustomizedYAxisTick} from './CustomizedAxisTick.jsx';
import {CustomizedTooltip} from './CustomizedTooltip.jsx';
import InfoTooltip from '../InfoTooltip/InfoTooltip';

function BeschikbareVoertuigenChart({
  filter,
  config,
  title
}: {
  filter: any,
  config: any,
  title?: string
}) {
  const dispatch = useDispatch()
  
  // Get authentication token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get metadata
  const metadata = useSelector((state: StateType) => state.metadata)
  
  const aanbieders = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });
  
  // Get all zones
  const zones = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  // Define state variables
  const [vehiclesData, setVehiclesData] = useState([])

  // On updated filter: re-fetch data
  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;

    async function fetchData() {
      // Get aggregated vehicle data
      const aggregatedVehicleData = await getAggregatedVehicleData(token, filter, zones, metadata);
      if(! aggregatedVehicleData) return;

      // Set state
      setVehiclesData(aggregatedVehicleData);

      // Sum amount of vehicles per operator, used in FilteritemAanbieders component
      let operators;
      if(aggregatedVehicleData && aggregatedVehicleData.available_vehicles_aggregated_stats) {
        operators = getOperatorStatsForChart(aggregatedVehicleData.available_vehicles_aggregated_stats.values, metadata.aanbieders);
      }
      else {
        operators = getOperatorStatsForChart(aggregatedVehicleData.availability_stats.values, metadata.aanbieders);
      }
      dispatch({type: 'SET_OPERATORSTATS_BESCHIKBAREVOERTUIGENCHART', payload: operators });
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
  let chartData = getAggregatedChartData(vehiclesData, filter, zones, aanbieders);

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
              stroke="#fff"
              strokeWidth={2}
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
    <div className="relative">
      
      <div className="flex justify-between my-2">
        <div className="flex flex-start">

          {title && <h2 className="text-4xl my-2">
            {title}
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

        {doShowDetailledAggregatedData(filter, zones) && <div className={"text-sm flex flex-col justify-center"}>
          <div className="flex">
            {doShowDetailledAggregatedData(filter, zones) && (
              <InfoTooltip className="mx-2 inline-block">
                {/*Zie in ieder tijdsinterval wat de minimale bezetting was, de gemiddelde bezetting of juist de maximale bezetting.*/}
                Zie in ieder tijdsinterval wat de maximale bezetting was.
              </InfoTooltip>
            )}

            {/* As long as min doesn't count 0 values, only show 'max' */}
            {aggregationFunctionButtonsToRender.map(x => renderAggregationFunctionButton(x.name, x.title))}
          </div>
        </div>}

      </div>

      <div className="relative" style={{ width: '100%', height: config?.height || '400px' }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>

    </div>
  )
}

export default BeschikbareVoertuigenChart;
