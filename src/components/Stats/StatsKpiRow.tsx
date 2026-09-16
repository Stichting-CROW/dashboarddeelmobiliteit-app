import React from 'react';
import {useSelector} from 'react-redux';

import {StateType} from '../../types/StateType';
import {Skeleton} from '../ui/skeleton';
import {useAggregatedChartData, ChartDataFetcher} from '../Chart/useAggregatedChartData';
import {formatNumber, formatPercentageDelta} from '../Chart/chartFormatting';
import {
  getAggregatedVehicleData,
  getAggregatedRentalsData,
  getAggregatedChartData,
  getAggregatedRentalsChartData
} from '../../helpers/stats/index';
import {
  computeKpis,
  computeDelta,
  getPreviousPeriodFilter,
  StatsKpis,
  KpiDelta
} from '../../helpers/stats/kpi';

import './StatsKpiRow.css';

interface PeriodData {
  vehicles: unknown;
  rentals: unknown;
}

interface KpiSourceData {
  /** Day-level filter used for the current period (needed to prepare the rows) */
  currentFilter: any;
  previousFilter: any;
  current: PeriodData;
  previous: PeriodData | null;
}

/**
 * KPI's are always computed on day-level data, independent of the interval
 * chosen for the charts, so totals and averages stay comparable.
 */
const fetchKpiSourceData: ChartDataFetcher<KpiSourceData> = async (token, filter, zones, metadata) => {
  const currentFilter = {...filter, ontwikkelingaggregatie: 'day'};
  const previousFilter = getPreviousPeriodFilter(currentFilter);

  const [vehicles, rentals, previousVehicles, previousRentals] = await Promise.all([
    getAggregatedVehicleData(token, currentFilter, zones, metadata),
    getAggregatedRentalsData(token, currentFilter, zones, metadata),
    getAggregatedVehicleData(token, previousFilter, zones, metadata),
    getAggregatedRentalsData(token, previousFilter, zones, metadata)
  ]);

  if (!vehicles && !rentals) return undefined;

  return {
    currentFilter,
    previousFilter,
    current: {vehicles, rentals},
    previous: previousVehicles || previousRentals
      ? {vehicles: previousVehicles, rentals: previousRentals}
      : null
  };
};

type Trend = 'positive' | 'neutral';

interface KpiTileProps {
  label: string;
  value: string;
  unit?: string;
  delta: KpiDelta;
  /** How to display the change: as percentage or as absolute number */
  deltaMode: 'percentage' | 'absolute';
  /** Whether an increase should be coloured as good (positive) or neutral */
  trend: Trend;
  isLoading: boolean;
}

function KpiTile({label, value, unit, delta, deltaMode, trend, isLoading}: KpiTileProps) {
  const renderDelta = () => {
    const amount = deltaMode === 'percentage' ? delta.ratio : delta.absolute;
    if (amount === null) {
      return <span className="text-gray-400">Geen vergelijking</span>;
    }
    const direction = amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat';
    const colorClass =
      direction === 'flat' || trend === 'neutral'
        ? 'text-gray-600 bg-gray-100'
        : direction === 'up'
          ? 'text-green-700 bg-green-50'
          : 'text-red-700 bg-red-50';
    const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●';
    const text =
      direction === 'flat'
        ? 'Gelijk'
        : deltaMode === 'percentage'
          ? formatPercentageDelta(amount)
          : `${amount > 0 ? '+' : ''}${formatNumber(amount)}`;
    return (
      <>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          <span aria-hidden="true" className="text-[9px]">{arrow}</span>
          {text}
        </span>
        <span className="text-gray-400">t.o.v. vorige periode</span>
      </>
    );
  };

  return (
    <div className="StatsKpiRow-tile rounded-lg bg-gray-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      {isLoading ? (
        <>
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-2 h-4 w-32" />
        </>
      ) : (
        <>
          <div className="mt-1 text-2xl font-semibold text-gray-900 leading-tight">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">{renderDelta()}</div>
        </>
      )}
    </div>
  );
}

/**
 * Headline numbers for the selected area and period, each compared with the
 * previous period of equal length.
 */
function StatsKpiRow() {
  const zones = useSelector((state: StateType) => (state.metadata?.zones ? state.metadata.zones : []));
  const aanbieders = useSelector((state: StateType) =>
    state.metadata?.aanbieders ? state.metadata.aanbieders : []
  );

  const {data, isLoading, error} = useAggregatedChartData<KpiSourceData>(
    fetchKpiSourceData,
    undefined,
    {ignoreAggregationLevel: true}
  );

  const toKpis = (period: PeriodData | null, periodFilter: any): StatsKpis | null => {
    if (!period) return null;
    const vehicleRows = period.vehicles
      ? getAggregatedChartData(period.vehicles as any, periodFilter, zones, aanbieders)
      : [];
    const rentalRows = period.rentals
      ? getAggregatedRentalsChartData(period.rentals as any, periodFilter, zones, aanbieders)
      : [];
    return computeKpis(vehicleRows, rentalRows);
  };

  const current = data ? toKpis(data.current, data.currentFilter) : null;
  const previous = data ? toKpis(data.previous, data.previousFilter) : null;

  const formatValue = (value: number | null, decimals?: number) =>
    value === null ? '—' : formatNumber(value, decimals);

  // Hide the row entirely when loading failed: the charts already show the error.
  if (error) return null;

  const tiles: KpiTileProps[] = [
    {
      label: 'Gem. beschikbare voertuigen',
      value: formatValue(current?.averageAvailableVehicles ?? null, 0),
      unit: 'per dag',
      delta: computeDelta(current?.averageAvailableVehicles ?? null, previous?.averageAvailableVehicles ?? null),
      deltaMode: 'percentage',
      trend: 'positive',
      isLoading
    },
    {
      label: 'Verhuringen',
      value: formatValue(current?.totalRentals ?? null, 0),
      unit: 'totaal',
      delta: computeDelta(current?.totalRentals ?? null, previous?.totalRentals ?? null),
      deltaMode: 'percentage',
      trend: 'positive',
      isLoading
    },
    {
      label: 'Verhuringen per voertuig',
      value: formatValue(current?.rentalsPerVehiclePerDay ?? null, 2),
      unit: 'per dag',
      delta: computeDelta(current?.rentalsPerVehiclePerDay ?? null, previous?.rentalsPerVehiclePerDay ?? null),
      deltaMode: 'percentage',
      trend: 'positive',
      isLoading
    },
    {
      label: 'Actieve aanbieders',
      value: formatValue(current?.activeProviders ?? null, 0),
      delta: computeDelta(current?.activeProviders ?? null, previous?.activeProviders ?? null),
      deltaMode: 'absolute',
      trend: 'neutral',
      isLoading
    }
  ];

  return (
    <div className="StatsKpiRow grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Kerncijfers">
      {tiles.map((tile) => (
        <KpiTile key={tile.label} {...tile} />
      ))}
    </div>
  );
}

export default StatsKpiRow;
