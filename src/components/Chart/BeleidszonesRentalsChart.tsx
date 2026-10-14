import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { StateType } from '../../types/StateType';
import {
  getZoneRentalStats,
  getZoneIdsForMunicipality,
} from '../../api/zoneStatistics';
import { getAggregatedStats } from '../../api/aggregatedStats';
import { getDateFormat } from '../../helpers/stats/index';
import { CustomizedXAxisTick } from './CustomizedAxisTick.jsx';

interface BeleidszonesRentalsChartProps {
  title?: string;
}

function sumRentalsPerBucket(
  values: Array<Record<string, unknown>>,
  timeKey: string
): Map<string, number> {
  const result = new Map<string, number>();

  values.forEach((item) => {
    const t = item[timeKey];
    if (!t) return;
    const timeStr = typeof t === 'string' ? t : String(t);
    const normalizedTime = moment(timeStr).format('YYYY-MM-DD');

    let sum = 0;
    Object.keys(item).forEach((key) => {
      if (key === timeKey || key === 'start_interval') return;
      const providerData = item[key];
      if (providerData && typeof providerData === 'object' && !Array.isArray(providerData)) {
        Object.values(providerData as Record<string, { rentals_started?: number }>).forEach((mod) => {
          if (mod?.rentals_started != null) {
            sum += Number(mod.rentals_started);
          }
        });
      }
    });

    const existing = result.get(normalizedTime) || 0;
    result.set(normalizedTime, existing + sum);
  });

  return result;
}

function sumMunicipalityRentalsPerBucket(
  values: Array<Record<string, unknown>>,
  timeKey: string
): Map<string, number> {
  const result = new Map<string, number>();

  values.forEach((item) => {
    const t = item[timeKey] ?? item.start_interval;
    if (!t) return;
    const timeStr = typeof t === 'string' ? t : String(t);
    const normalizedTime = moment(timeStr).format('YYYY-MM-DD');

    let sum = 0;
    Object.keys(item).forEach((key) => {
      if (key === timeKey || key === 'start_interval' || key === 'name' || key === 'time') return;
      const val = item[key];
      if (typeof val === 'number') sum += val;
      else if (typeof val === 'string' && !isNaN(Number(val))) sum += Number(val);
    });

    const existing = result.get(normalizedTime) || 0;
    result.set(normalizedTime, existing + sum);
  });

  return result;
}

function BeleidszonesRentalsChart({ title }: BeleidszonesRentalsChartProps) {
  const token = useSelector((state: StateType) =>
    state.authentication?.user_data?.token || null
  );
  const filter = useSelector((state: StateType) => state.filter);
  const metadata = useSelector((state: StateType) => state.metadata);

  const [chartData, setChartData] = useState<Array<{ time: string; percentage: number; total: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filter.gebied || !filter.ontwikkelingvan || !filter.ontwikkelingtot) {
      setChartData([]);
      setError('Selecteer een plaats en periode');
      return;
    }

    if (!metadata?.metadata_loaded) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const startTime = moment(filter.ontwikkelingvan).format('YYYY-MM-DD');
        const endTime = moment(filter.ontwikkelingtot).add(1, 'day').format('YYYY-MM-DD');
        const aggregationLevel = filter.ontwikkelingaggregatie || 'day';

        const zoneIds = await getZoneIdsForMunicipality(token, filter.gebied);
        if (zoneIds.length === 0) {
          setChartData([]);
          return;
        }

        const [hubData, munData] = await Promise.all([
          getZoneRentalStats(token, {
            zoneIds,
            startTime,
            endTime,
            aggregationLevel,
            aggregationFunction: 'MAX',
          }),
          getAggregatedStats(token, 'rentals', {
            filter: { ...filter, zones: '' },
            metadata,
            aggregationLevel,
            aggregationTime: filter.ontwikkelingaggregatie_tijd || '00:00:00',
          }),
        ]);

        if (cancelled) return;

        const hubValues = hubData?.rental_stats?.values || [];
        const munValues =
          munData?.rentals_aggregated_stats?.values ||
          munData?.rental_stats?.values ||
          [];
        const hubTimeKey = hubValues[0]?.time !== undefined ? 'time' : 'start_interval';
        const munTimeKey =
          munValues[0]?.time !== undefined
            ? 'time'
            : munValues[0]?.start_interval !== undefined
            ? 'start_interval'
            : 'name';

        const hubTotals = sumRentalsPerBucket(hubValues, hubTimeKey);
        const munTotals = sumMunicipalityRentalsPerBucket(munValues, munTimeKey);

        const allTimes = new Set([
          ...Array.from(hubTotals.keys()),
          ...Array.from(munTotals.keys()),
        ]);
        const sortedTimes = Array.from(allTimes).sort();

        const data = sortedTimes.map((t) => {
          const hub = hubTotals.get(t) || 0;
          const mun = munTotals.get(t) || 0;
          const pct = mun > 0 ? (hub / mun) * 100 : 0;
          return {
            time: moment(t).format(getDateFormat(aggregationLevel)),
            percentage: Math.round(pct * 10) / 10,
            total: `${hub} / ${mun}`,
          };
        });

        setChartData(data);
      } catch (err) {
        if (!cancelled) {
          console.error('BeleidszonesRentalsChart error:', err);
          setError('Kon gegevens niet laden');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [
    token,
    filter.gebied,
    filter.ontwikkelingvan,
    filter.ontwikkelingtot,
    filter.ontwikkelingaggregatie,
    filter.ontwikkelingaggregatie_tijd,
    metadata?.metadata_loaded,
  ]);

  if (error) {
    return (
      <div className="relative">
        {title && <h2 className="text-4xl my-2">{title}</h2>}
        <div className="text-gray-500 py-8">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative">
        {title && <h2 className="text-4xl my-2">{title}</h2>}
        <div className="text-gray-500 py-8">Laden...</div>
      </div>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="relative">
      {title && <h2 className="text-4xl my-2">{title}</h2>}
      <div
        className="relative"
        style={{ width: '100%', height: '400px' }}
      >
        {hasData ? (
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 0" vertical={false} />
              <XAxis
                dataKey="time"
                tick={<CustomizedXAxisTick />}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload?.[0]) {
                    const p = payload[0].payload;
                    return (
                      <div className="CustomizedTooltip bg-white p-2 border rounded shadow">
                        <div className="font-bold">{label}</div>
                        <div>
                          {p.percentage}% ({p.total})
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#FD862E"
                fill="#FD862E"
                fillOpacity={0.4}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 py-8">Geen data beschikbaar</div>
        )}
      </div>
    </div>
  );
}

export default BeleidszonesRentalsChart;
