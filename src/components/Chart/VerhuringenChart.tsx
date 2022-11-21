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

import {
  getAggregatedStats,
  getAggregatedStats_timescaleDB
} from '../../api/aggregatedStats';
import {
  getProviderColor,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {
  prepareAggregatedStatsData,
  prepareAggregatedStatsData_timescaleDB,
  sumAggregatedStats,
  doShowDetailledAggregatedData,
  prepareDataForCsv,
  downloadCsv,
  getDateFormat
} from '../../helpers/stats';

import {CustomizedXAxisTick, CustomizedYAxisTick} from '../Chart/CustomizedAxisTick.jsx';
import {CustomizedTooltip} from '../Chart/CustomizedTooltip.jsx';

function VerhuringenChart(props) {
  const dispatch = useDispatch()

  const token = useSelector(state => (state.authentication.user_data && state.authentication.user_data.token)||null)
  const filter = useSelector(state => state.filter)
  const metadata = useSelector(state => state.metadata)

  const [rentalsData, setRentalsData] = useState([])

  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;
    async function fetchData() {
      const rentals = await getAggregatedStats(token, 'rentals', {
        filter: filter,
        metadata: metadata,
        aggregationLevel: filter.ontwikkelingaggregatie
      });

      // Return if no stats are available
      if(! rentals || ! rentals.rentals_aggregated_stats) {
        return;
      }

      let operators = getOperatorStatsForChart(rentals.rentals_aggregated_stats.values, metadata.aanbieders)
      dispatch({type: 'SET_OPERATORSTATS_VERHURINGENCHART', payload: operators });

      setRentalsData(rentals);
    }
    fetchData();
  }, [filter, filter.ontwikkelingaggregatie, metadata, token, dispatch]);
  
  //
  const chartdata = prepareAggregatedStatsData('rentals', rentalsData, filter.ontwikkelingaggregatie, filter.aanbiedersexclude);
  // 
  const getchartDataWithNiceDates = (data) => {
    const aggregationLevel = filter.ontwikkelingaggregatie;
    const dateFormat = getDateFormat(aggregationLevel);
    return data.map(x => {
      return {...x, ...{ name: moment(x.name).format(dateFormat) }}
    })
  }
  const chartdataWithNiceDates = getchartDataWithNiceDates(chartdata)

  const numberOfPointsOnXAxis = rentalsData ? Object.keys(rentalsData).length : 0;

  const renderChart = () => {
    if(numberOfPointsOnXAxis > 12) {
      return <AreaChart
        data={chartdataWithNiceDates}
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
        {getUniqueProviderNames(chartdataWithNiceDates).map(x => {
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
      data={chartdataWithNiceDates}
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
      <Legend></Legend>
      {getUniqueProviderNames(chartdataWithNiceDates).map(x => {
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
    <div className="relative">

      <div className="flex flex-start">

        {props.title && <h2 className="text-4xl my-2">
          {props.title}
        </h2>}

        {chartdata && chartdata.length > 0 && <div className="flex justify-center flex-col ml-2">
          <button onClick={() => {
            const preparedData = prepareDataForCsv(chartdata);
            const filename = `${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}_to_${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}`;
            downloadCsv(preparedData, filename);
          }} className="opacity-50 cursor-pointer">
            <img src="/components/StatsPage/icon-download-to-csv.svg" width="30`" alt="Download to CSV" title="Download to CSV" />
          </button>
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
