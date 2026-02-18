import React, {useEffect, useState} from 'react';

import {StateType} from '../../types/StateType';

import {useSelector} from 'react-redux';

import moment from 'moment';

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

import {
  getProviderColor,
  getPrettyProviderName,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {
  getAggregatedVehicleData,
  getAggregatedChartData,
  getAggregatedRentalsData,
  getAggregatedRentalsChartData,
  getDateFormat,
  prepareDataForCsv,
  downloadCsv
} from '../../helpers/stats/index';

import {CustomizedXAxisTick, CustomizedYAxisTick} from './CustomizedAxisTick.jsx';
import './CustomizedTooltip.css';

interface VerhuringenPerVoertuigChartProps {
  title?: string;
}

function mergeRentalsPerVehicle(
  vehiclesChartData: Record<string, unknown>[],
  rentalsChartData: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!vehiclesChartData?.length || !rentalsChartData?.length) return [];

  return vehiclesChartData.map((vehicleRow, index) => {
    const rentalsRow = rentalsChartData[index];
    if (!rentalsRow) return vehicleRow;

    const timeKey = vehicleRow.time ? 'time' : 'name';
    const timeValue = vehicleRow.time || vehicleRow.name;

    const merged: Record<string, unknown> = {[timeKey]: timeValue, time: timeValue};

    const providerKeys = new Set([
      ...Object.keys(vehicleRow).filter((k) => k !== 'time' && k !== 'name'),
      ...Object.keys(rentalsRow).filter((k) => k !== 'time' && k !== 'name')
    ]);

    providerKeys.forEach((provider) => {
      const vehicles = Number(vehicleRow[provider]) || 0;
      const rentals = Number(rentalsRow[provider]) || 0;
      merged[provider] = vehicles > 0 ? Math.round((rentals / vehicles) * 100) / 100 : 0;
    });

    return merged;
  });
}

const RatioTooltip = ({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{name: string; value: number; fill: string}>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const displayValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2));

    return (
      <div className="CustomizedTooltip">
        <div className="my-0">
          <b>{label}</b>
        </div>
        <ul className="my-0 py-0">
          {payload.map((x, i) => (
            <li key={'c-' + i} style={{color: x.fill}}>
              {x.name}: {displayValue(x.value)}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

function VerhuringenPerVoertuigChart({title = 'Verhuringen per voertuig'}: VerhuringenPerVoertuigChartProps) {

  const token = useSelector((state: StateType) =>
    state.authentication?.user_data?.token ? state.authentication.user_data.token : null
  );
  const filter = useSelector((state: StateType) => state.filter);
  const metadata = useSelector((state: StateType) => state.metadata);
  const aanbieders = useSelector((state: StateType) =>
    state.metadata?.aanbieders ? state.metadata.aanbieders : []
  );
  const zones = useSelector((state: StateType) =>
    state.metadata?.zones ? state.metadata.zones : []
  );

  const [vehiclesData, setVehiclesData] = useState<Record<string, unknown> | null>(null);
  const [rentalsData, setRentalsData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!metadata?.zones || metadata.zones.length <= 0) return;

    async function fetchData() {
      const [aggregatedVehicleData, aggregatedRentalsData] = await Promise.all([
        getAggregatedVehicleData(token, filter, zones, metadata),
        getAggregatedRentalsData(token, filter, zones, metadata)
      ]);

      if (aggregatedVehicleData) setVehiclesData(aggregatedVehicleData);
      if (aggregatedRentalsData) setRentalsData(aggregatedRentalsData);
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
    zones
  ]);

  const vehiclesChartData = getAggregatedChartData(
    vehiclesData as Parameters<typeof getAggregatedChartData>[0],
    filter,
    zones,
    aanbieders
  );
  const rentalsChartData = getAggregatedRentalsChartData(
    rentalsData as Parameters<typeof getAggregatedRentalsChartData>[0],
    filter,
    zones,
    aanbieders
  );

  const chartData = mergeRentalsPerVehicle(vehiclesChartData, rentalsChartData);

  const getChartDataWithNiceDates = (data: Record<string, unknown>[]) => {
    const dateFormat = getDateFormat(filter.ontwikkelingaggregatie);
    return data.map((x) => ({
      ...x,
      time: moment((x.time ?? x.name) as string).format(dateFormat)
    }));
  };
  const chartDataWithNiceDates = getChartDataWithNiceDates(chartData);

  const numberOfPointsOnXAxis = chartData?.length ?? 0;
  const providerNames = getUniqueProviderNames(chartDataWithNiceDates).filter(
    (x) => x !== 'time' && x !== 'name'
  );

  const renderChart = () => {
    if (
      numberOfPointsOnXAxis > 24 &&
      filter.ontwikkelingaggregatie !== '15m' &&
      filter.ontwikkelingaggregatie !== '5m' &&
      filter.ontwikkelingaggregatie !== 'hour'
    ) {
      return (
        <AreaChart
          data={chartDataWithNiceDates}
          margin={{top: 10, right: 30, left: 0, bottom: 0}}
        >
          <CartesianGrid strokeDasharray="3 0" vertical={false} />
          <XAxis dataKey="time" tick={<CustomizedXAxisTick />} />
          <YAxis tick={<CustomizedYAxisTick />} />
          <Tooltip content={<RatioTooltip />} />
          <Legend />
          {providerNames.map((x) => {
            const providerColor = getProviderColor(metadata?.aanbieders ?? [], x);
            return (
              <Area
                key={x}
                type="monotone"
                dataKey={x}
                name={getPrettyProviderName(x)}
                stroke={providerColor}
                fill={providerColor}
                isAnimationActive={false}
              />
            );
          })}
        </AreaChart>
      );
    }

    return (
      <BarChart
        data={chartDataWithNiceDates}
        margin={{top: 10, right: 30, left: 0, bottom: 0}}
      >
        <CartesianGrid strokeDasharray="3 0" vertical={false} />
        <XAxis dataKey="time" tick={<CustomizedXAxisTick />} />
        <YAxis tick={<CustomizedYAxisTick />} />
        <Tooltip content={<RatioTooltip />} />
        <Legend />
        {providerNames.map((x) => {
          const providerColor = getProviderColor(metadata?.aanbieders ?? [], x);
          return (
            <Bar
              key={x}
              type="monotone"
              dataKey={x}
              name={getPrettyProviderName(x)}
              stroke={providerColor}
              fill={providerColor}
              isAnimationActive={false}
            />
          );
        })}
      </BarChart>
    );
  };

  return (
    <div className="relative">
      <div className="flex justify-between my-2">
        <div className="flex flex-start">
          {title && (
            <h2 className="text-4xl my-2">
              {title}
            </h2>
          )}
          {chartData && chartData.length > 0 && (
            <div className="flex justify-center flex-col ml-2">
              <button
                onClick={() => {
                  const preparedData = prepareDataForCsv(chartData);
                  const filename = `${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}_to_${moment(filter.ontwikkelingtot).format('YYYY-MM-DD')}_verhuringen_per_voertuig`;
                  downloadCsv(preparedData, filename);
                }}
                className="opacity-50 cursor-pointer"
              >
                <img
                  src="/components/StatsPage/icon-download-to-csv.svg"
                  width="30"
                  alt="Download to CSV"
                  title="Download to CSV"
                />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="relative" style={{width: '100%', height: '400px'}}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default VerhuringenPerVoertuigChart;
