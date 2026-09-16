import React from 'react';

import { getOperatorStatsForChart, transformZerosToNullForChart } from './chartTools.js';

import {StateType} from '../../types/StateType.js';

import {
  useDispatch,
  useSelector
} from 'react-redux';

import moment from 'moment';

import {
  LineChart,
  Line,
  XAxis,
  Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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
import ChartSkeleton from './ChartSkeleton';
import {ChartEmptyState, ChartErrorState, ChartRefreshingOverlay} from './ChartStates';
import {useAggregatedChartData} from './useAggregatedChartData';
import {useLegendToggle} from './useLegendToggle';
import {CHART_SYNC_ID, TOTAAL_STROKE, TOTAAL_DASH} from './chartConstants';

const TOTAAL_KEY = 'Totaal';

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

  // Get metadata
  const metadata = useSelector((state: StateType) => state.metadata)
  
  const aanbieders = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });
  
  // Get all zones
  const zones = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.zones) ? state.metadata.zones : [];
  });

  // Load the aggregated vehicle data for the current filter. The hook handles
  // waiting for zones, stale responses, and loading/error state.
  const {
    data: vehiclesData,
    isLoading,
    isRefreshing,
    error,
    refetch
  } = useAggregatedChartData<any>(
    getAggregatedVehicleData,
    (aggregatedVehicleData) => {
      // Sum amount of vehicles per operator, used in FilteritemAanbieders component
      let operators;
      if(aggregatedVehicleData.available_vehicles_aggregated_stats) {
        operators = getOperatorStatsForChart(aggregatedVehicleData.available_vehicles_aggregated_stats.values, metadata.aanbieders);
      }
      else {
        operators = getOperatorStatsForChart(aggregatedVehicleData.availability_stats.values, metadata.aanbieders);
      }
      dispatch({type: 'SET_OPERATORSTATS_BESCHIKBAREVOERTUIGENCHART', payload: operators });
    }
  );

  // Clickable legend: hide/show individual providers
  const legend = useLegendToggle();

  // Populate chart data
  let chartData = getAggregatedChartData(vehiclesData || [], filter, zones, aanbieders);

  const getChartDataWithNiceDates = (data) => {
    if (!data?.length) return [];
    const aggregationLevel = filter.ontwikkelingaggregatie;
    const dateFormat = getDateFormat(aggregationLevel);
    const providerKeys = Object.keys(data[0]).filter(k => k !== 'time' && k !== 'name');
    const showTotaal = providerKeys.length > 1;
    return data.map(x => {
      const timeFormatted = moment(x.time ? x.time : x.name).format(dateFormat);
      const row = { ...x, time: timeFormatted };
      if (showTotaal) {
        const totaal = providerKeys.reduce((sum, k) => sum + (Number(x[k]) || 0), 0);
        row[TOTAAL_KEY] = totaal;
      }
      return row;
    });
  };
  const chartDataWithNiceDatesRaw = getChartDataWithNiceDates(chartData);
  const valueKeys = chartDataWithNiceDatesRaw?.[0]
    ? Object.keys(chartDataWithNiceDatesRaw[0]).filter((k) => k !== 'time' && k !== 'name')
    : [];
  const chartDataWithNiceDates = transformZerosToNullForChart(chartDataWithNiceDatesRaw, valueKeys);

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

  const getSeriesKeys = () => {
    const allKeys = getUniqueProviderNames(chartDataWithNiceDates);
    const providerKeys = allKeys.filter(k => k !== 'time' && k !== 'name');
    const totaalIndex = providerKeys.indexOf(TOTAAL_KEY);
    const providersOnly = providerKeys.filter(k => k !== TOTAAL_KEY);
    return { providersOnly, hasTotaal: totaalIndex >= 0 };
  };

  const renderLineSeries = () => {
    const { providersOnly, hasTotaal } = getSeriesKeys();
    const series: React.ReactNode[] = [];
    providersOnly.forEach(x => {
      series.push(
        <Line
          key={x}
          type="monotone"
          dataKey={x}
          name={getPrettyProviderName(x)}
          stroke={getProviderColor(metadata.aanbieders, x)}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          dot={false}
          isAnimationActive={false}
          connectNulls
          hide={legend.isHidden(x)}
        />
      );
    });
    if (hasTotaal && providersOnly.length > 1) {
      series.push(
        <Line
          key={TOTAAL_KEY}
          type="monotone"
          dataKey={TOTAAL_KEY}
          name={TOTAAL_KEY}
          stroke={TOTAAL_STROKE}
          strokeWidth={2}
          strokeDasharray={TOTAAL_DASH}
          strokeLinejoin="round"
          strokeLinecap="round"
          dot={false}
          isAnimationActive={false}
          connectNulls
          hide={legend.isHidden(TOTAAL_KEY)}
        />
      );
    }
    return series;
  };

  const renderChart = () => (
    <LineChart
      data={chartDataWithNiceDates}
      syncId={CHART_SYNC_ID}
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
      <Tooltip content={<CustomizedTooltip />} contentStyle={{ color: '#333333' }} />
      {config?.sumTotal !== true && <Legend {...legend.legendProps} />}
      {renderLineSeries()}
    </LineChart>
  );

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
              const filename = `${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}_to_${moment(filter.ontwikkelingtot).format('YYYY-MM-DD')}_beschikbare_voertuigen`;
              downloadCsv(preparedData, filename);
            }} className="opacity-50 cursor-pointer">
              <img src="/components/StatsPage/icon-download-to-csv.svg" width="30" alt="Download to CSV" title="Download to CSV" />
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
        {isLoading ? (
          <ChartSkeleton height="100%" />
        ) : error ? (
          <ChartErrorState onRetry={refetch} />
        ) : !chartData || chartData.length === 0 ? (
          <ChartEmptyState />
        ) : (
          <>
            {isRefreshing && <ChartRefreshingOverlay />}
            <ResponsiveContainer>
              {renderChart()}
            </ResponsiveContainer>
          </>
        )}
      </div>

    </div>
  )
}

export default BeschikbareVoertuigenChart;
