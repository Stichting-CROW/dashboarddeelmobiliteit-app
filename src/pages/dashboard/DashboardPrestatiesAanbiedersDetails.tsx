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

  // Build the message
  const message = `Hier zie je de data van gemeente ${municipalityName}, specifiek over de <b>${formFactorName}en</b> van <b>${operatorName}</b>.`;

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

  // Chart titles matching the screenshot
  const chartTitles = [
    'Aantal onverhuurde voertuigen',
    'Aantal beschikbare voertuigen',
    'Aantal defecte voertuigen',
    'Voertuigen met parkeerduur langer dan < 7 dagen >',
    'Aantal voertuigen in verbodsgebied',
    'Aantal verhuringen per voertuig',
    'Data-kwaliteit',
    'PM',
    'PM'
  ];

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

    // TODO: Transform kpiData to chart format based on actual API response structure
    // For now, keeping the structure but this should be updated once we know the API response format
    // The API response structure needs to be mapped to the chart data format
    
    // Example transformation (adjust based on actual API response):
    // Assuming API returns data in format like:
    // { 
    //   dates: ['2025-09-16', ...],
    //   kpis: [
    //     { name: 'unrented_vehicles', values: [...], kpi_threshold: 10 },
    //     ...
    //   ]
    // }
    
    // For now, if kpiData exists but structure is unknown, show empty charts
    // This will be updated once we see the actual API response
    if (kpiData && typeof kpiData === 'object') {
      // Placeholder: Generate chart data structure
      // Replace this with actual data transformation based on API response
      const newChartsData = chartTitles.map((title, index) => {
        // This is a placeholder - replace with actual data mapping
        const performanceData = validDateRange.map(() => 0);
        const kpiValue = 0;
        
        return {
          title,
          series: [
            {
              name: operatorName || 'Prestatie aanbieder',
              data: performanceData,
              dashArray: 0 // Solid line
            },
            {
              name: 'KPI',
              data: validDateRange.map(() => kpiValue),
              dashArray: 5 // Dashed line
            }
          ] as LineChartData[]
        };
      });

      setChartsData(newChartsData);
    } else {
      setChartsData([]);
    }
  }, [kpiData, dateRange, operatorName]);

  return (
    <div className="DashboardPrestatiesAanbiedersDetails pt-4 pb-24">
      <PageTitle>Prestaties aanbieders details</PageTitle>
      <p className="my-4">
        {message}
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
              colors={['#ef4444', '#ef4444']}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPrestatiesAanbiedersDetails;
