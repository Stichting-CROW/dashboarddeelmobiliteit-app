import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import './DashboardPrestatiesAanbieders.css';
import PageTitle from '../../components/common/PageTitle';
import { StateType } from '../../types/StateType';
import { fetchOperators, type OperatorData } from '../../api/operators';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import LineChart, { LineChartData } from '../../components/Chart/LineChart';
import moment from 'moment';
import { getKpiOverviewOperators } from '../../api/kpiOverview';

interface DashboardPrestatiesAanbiedersDetailsProps {

}

function DashboardPrestatiesAanbiedersDetails(props: DashboardPrestatiesAanbiedersDetailsProps) {
  const gebieden = useSelector((state: StateType) => state.metadata.gebieden);
  const token = useSelector((state: StateType) => 
    (state.authentication.user_data && state.authentication.user_data.token) || null
  );
  const [operators, setOperators] = useState<OperatorData[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [urlSearch, setUrlSearch] = useState<string>(window.location.search);

  // Watch for URL changes (triggered by Filterbar using window.history.replaceState)
  const location = useLocation();
  
  // Listen for URL changes that don't trigger React Router's useLocation
  useEffect(() => {
    // Update from React Router location first
    setUrlSearch(location.search);
    
    const checkUrlChange = () => {
      const currentSearch = window.location.search;
      setUrlSearch(prevSearch => {
        if (currentSearch !== prevSearch) {
          return currentSearch;
        }
        return prevSearch;
      });
    };

    // Check periodically for URL changes (since replaceState doesn't trigger popstate)
    // Using a reasonable interval that balances responsiveness and performance
    const interval = setInterval(checkUrlChange, 200);
    
    // Also listen to popstate for back/forward navigation
    window.addEventListener('popstate', checkUrlChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', checkUrlChange);
    };
  }, [location.search]);
  
  // Get query parameters from URL
  const queryParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);
  const municipalityCode = queryParams.get('gm_code');
  // Check for system_id first, fall back to operator for backward compatibility
  const operatorCode = queryParams.get('system_id') || queryParams.get('operator');
  const formFactorCode = queryParams.get('form_factor');
  const startDateParam = queryParams.get('start_date');
  const endDateParam = queryParams.get('end_date');

  // Get dates from URL params, default to last 60 days if not present
  const startDate = useMemo(() => {
    if (startDateParam) {
      const parsed = moment(startDateParam);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }
    return moment().subtract(60, 'days').toDate();
  }, [startDateParam]);

  const endDate = useMemo(() => {
    if (endDateParam) {
      const parsed = moment(endDateParam);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }
    return moment().toDate();
  }, [endDateParam]);

  // Fetch operators
  useEffect(() => {
    fetchOperators().then((ops) => {
      if (ops) {
        setOperators(ops);
      }
    });
  }, []);

  // Fetch KPI data from API
  useEffect(() => {
    if (!token || !municipalityCode || !formFactorCode || !operatorCode) {
      return;
    }

    const fetchKpiData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = {
          start_date: moment(startDate).format('YYYY-MM-DD'),
          end_date: moment(endDate).format('YYYY-MM-DD'),
          municipality: municipalityCode,
          form_factor: formFactorCode,
          system_id: operatorCode
        };

        const data = await getKpiOverviewOperators(token, params);
        setKpiData(data);
      } catch (err: any) {
        console.error('Error fetching KPI data:', err);
        setError(err.message || 'Failed to fetch KPI data');
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, [token, municipalityCode, formFactorCode, operatorCode, startDate, endDate]);

  // Find municipality name
  const municipality = municipalityCode 
    ? gebieden.find((g: any) => g.gm_code === municipalityCode)
    : null;
  const municipalityName = municipality?.name || municipalityCode || 'onbekende gemeente';

  // Find operator name
  const operator = operatorCode 
    ? operators.find((op) => op.system_id === operatorCode)
    : null;
  const operatorName = operator?.name || operatorCode || 'onbekende aanbieder';

  // Get readable form factor name
  const formFactorName = formFactorCode 
    ? getPrettyVehicleTypeName(formFactorCode) || formFactorCode
    : 'onbekend voertuigtype';

  // Get date range from local state (memoized to prevent recalculation)
  const dateRange = useMemo(() => {
    try {
      // Validate dates
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
      }
      
      // Ensure start is before end
      if (startDate > endDate) {
        return [];
      }
      
      const dates: number[] = [];
      const current = moment(startDate);
      const end = moment(endDate);
      
      // Limit to prevent excessive data points (max 365 days)
      const maxDays = 365;
      let dayCount = 0;
      
      while (current.isSameOrBefore(end, 'day') && dayCount < maxDays) {
        const timestamp = current.valueOf();
        if (isFinite(timestamp) && timestamp > 0) {
          dates.push(timestamp);
        }
        current.add(1, 'day');
        dayCount++;
      }
      
      return dates;
    } catch (error) {
      console.error('Error generating date range:', error);
      return [];
    }
  }, [startDate, endDate]);

  // Generate chart data for each chart (stored in state to prevent regeneration)
  const [chartsData, setChartsData] = useState<Array<{ title: string; series: LineChartData[] }>>([]);

  // Transform API data to chart format
  useEffect(() => {
    if (!kpiData || !dateRange || dateRange.length === 0) {
      setChartsData([]);
      return;
    }

    // Validate dateRange contains valid timestamps
    const validDateRange = dateRange.filter((date) => 
      typeof date === 'number' && isFinite(date) && date > 0
    );

    if (validDateRange.length === 0) {
      setChartsData([]);
      return;
    }
    // Extract performance indicator descriptions and operator KPI data
    const performanceIndicators = kpiData?.performance_indicator_description || [];
    const operatorData = kpiData?.municipality_modality_operators?.[0];
    const kpiValues = operatorData?.kpis || [];

    if (performanceIndicators.length === 0) {
      setChartsData([]);
      return;
    }

    // Create a map of kpi_key to values for quick lookup
    const kpiValuesMap = new Map<string, Array<{ date: string; measured: number; threshold?: number }>>();
    kpiValues.forEach((kpi: any) => {
      if (kpi.kpi_key && kpi.values) {
        kpiValuesMap.set(kpi.kpi_key, kpi.values);
      }
    });

    // Transform each performance indicator to chart data
    const newChartsData = performanceIndicators.map((indicator: any) => {
      const { kpi_key, title } = indicator;
      const values = kpiValuesMap.get(kpi_key) || [];

      // Create maps of date strings to measured values and threshold values
      const valuesByDate = new Map<string, number>();
      const thresholdsByDate = new Map<string, number>();
      values.forEach((item: { date: string; measured: number; threshold?: number }) => {
        if (item.date) {
          if (item.measured !== undefined && item.measured !== null) {
            valuesByDate.set(item.date, item.measured);
          }
          if (item.threshold !== undefined && item.threshold !== null) {
            thresholdsByDate.set(item.date, item.threshold);
          }
        }
      });

      // Map dateRange timestamps to measured values
      const measuredData = validDateRange.map((timestamp) => {
        const dateStr = moment(timestamp).format('YYYY-MM-DD');
        return valuesByDate.get(dateStr) ?? null;
      });

      // Map dateRange timestamps to threshold values
      const thresholdData = validDateRange.map((timestamp) => {
        const dateStr = moment(timestamp).format('YYYY-MM-DD');
        return thresholdsByDate.get(dateStr) ?? null;
      });

      // Filter out null values and create [x, y] pairs for measured data
      const seriesData: [number, number][] = [];
      validDateRange.forEach((timestamp, index) => {
        const value = measuredData[index];
        if (value !== null && typeof value === 'number' && isFinite(value)) {
          seriesData.push([timestamp, value]);
        }
      });

      // Filter out null values and create [x, y] pairs for threshold data
      const thresholdSeriesData: [number, number][] = [];
      validDateRange.forEach((timestamp, index) => {
        const threshold = thresholdData[index];
        if (threshold !== null && typeof threshold === 'number' && isFinite(threshold)) {
          thresholdSeriesData.push([timestamp, threshold]);
        }
      });

      // Build series array with measured data and threshold (if available)
      const series: LineChartData[] = [
        {
          name: operatorName || 'Prestatie aanbieder',
          data: seriesData.length > 0 ? seriesData : [],
          dashArray: 0 // Solid line
        }
      ];

      // Add threshold line if threshold data is available
      if (thresholdSeriesData.length > 0) {
        series.push({
          name: 'Drempelwaarde',
          data: thresholdSeriesData,
          dashArray: 5 // Dashed line
        });
      }

      return {
        title: title || kpi_key,
        series: series
      };
    });

    setChartsData(newChartsData);
  }, [kpiData, dateRange, operatorName]);

  return (
    <div className="DashboardPrestatiesAanbiedersDetails pt-4 pb-24">
      <PageTitle>Prestaties aanbieders details</PageTitle>
      <p className="my-4">
        Hier zie je de data van gemeente {municipalityName}, specifiek over de <b>{formFactorName}en</b> van <b>{operatorName}</b>.
      </p>
      <p className="my-4">
        Ga naar <Link to="/dashboard/prestaties-aanbieders">Prestaties aanbieders</Link> voor een andere combinatie van aanbieder en voertuigtype.
      </p>

      {loading && (
        <div className="my-4">Laden...</div>
      )}

      {error && (
        <div className="my-4 text-red-600">Fout: {error}</div>
      )}
      
      {!loading && !error && chartsData.length > 0 && dateRange.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-8">
          {chartsData.map((chart, index) => (
            <LineChart
              key={index}
              title={chart.title}
              series={chart.series}
              xAxisCategories={dateRange}
              height={250}
              colors={chart.series.length > 1 ? ['#ef4444', '#6b7280'] : ['#ef4444']}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPrestatiesAanbiedersDetails;
