import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import './DashboardPrestatiesAanbieders.css';
import PageTitle from '../../components/common/PageTitle';
import { StateType } from '../../types/StateType';
import { fetchOperators, type OperatorData } from '../../api/operators';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import LineChart, { LineChartData } from '../../components/Chart/LineChart';
import moment from 'moment';

interface DashboardPrestatiesAanbiedersDetailsProps {

}

function DashboardPrestatiesAanbiedersDetails(props: DashboardPrestatiesAanbiedersDetailsProps) {
  const gebieden = useSelector((state: StateType) => state.metadata.gebieden);
  const filter = useSelector((state: StateType) => state.filter);
  const [operators, setOperators] = useState<OperatorData[]>([]);

  // Get query parameters from URL
  const queryParams = new URLSearchParams(window.location.search);
  const geometryRef = queryParams.get('geometry_ref');
  const operatorCode = queryParams.get('operator');
  const formFactorCode = queryParams.get('form_factor');

  // Fetch operators
  useEffect(() => {
    fetchOperators().then((ops) => {
      if (ops) {
        setOperators(ops);
      }
    });
  }, []);

  // Extract municipality code from geometry_ref (format: cbs:${municipality})
  const municipalityCode = geometryRef?.startsWith('cbs:') 
    ? geometryRef.replace('cbs:', '') 
    : null;

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
  const message = `Hier zie je de data van gemeente ${municipalityName}, specifiek over de ${formFactorName}en van ${operatorName}.`;

  // Get date range from filter (memoized to prevent recalculation)
  const dateRange = useMemo(() => {
    try {
      const startDate = filter?.ontwikkelingvan 
        ? moment(filter.ontwikkelingvan).toDate()
        : moment().subtract(30, 'days').toDate();
      const endDate = filter?.ontwikkelingtot 
        ? moment(filter.ontwikkelingtot).toDate()
        : new Date();
      
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
  }, [filter?.ontwikkelingvan, filter?.ontwikkelingtot]);

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

  // Generate random data for a line (ensuring valid numbers)
  const generateRandomData = (dates: number[], min: number, max: number): number[] => {
    return dates.map(() => {
      const value = Math.random() * (max - min) + min;
      // Ensure we return a valid finite number
      return isFinite(value) ? value : 0;
    });
  };

  // Generate horizontal line data (constant value, ensuring valid number)
  const generateHorizontalData = (dates: number[], value: number): number[] => {
    const validValue = isFinite(value) ? value : 0;
    return dates.map(() => validValue);
  };

  // Generate chart data when date range changes
  useEffect(() => {
    if (!dateRange || dateRange.length === 0) {
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

    const newChartsData = chartTitles.map((title) => {
      // Generate random KPI value (horizontal line) - ensure valid number
      const kpiValue = Math.max(5, Math.min(35, Math.random() * 30 + 5));
      
      // Generate random performance data
      const performanceData = generateRandomData(validDateRange, 0, 40);
      
      return {
        title,
        series: [
          {
            name: 'Prestatie aanbieder A',
            data: performanceData,
            dashArray: 0 // Solid line
          },
          {
            name: 'KPI',
            data: generateHorizontalData(validDateRange, kpiValue),
            dashArray: 5 // Dashed line
          }
        ] as LineChartData[]
      };
    });

    setChartsData(newChartsData);
  }, [dateRange]);

  return (
    <div className="DashboardPrestatiesAanbiedersDetails pt-4 pb-24">
      <PageTitle>Prestaties aanbieders details</PageTitle>
      <p className="my-4">
        {message}
      </p>
      <p className="my-4">
        Ga naar <Link to="/dashboard/prestaties-aanbieders">Prestaties aanbieders</Link> voor een andere combinatie van aanbieder en voertuigtype.
      </p>
      
      {chartsData.length > 0 && dateRange.length > 0 && (
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
