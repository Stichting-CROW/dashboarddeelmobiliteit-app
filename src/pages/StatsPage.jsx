import React, {useEffect, useState, PureComponent } from 'react';

import {
  // useDispatch,
  useSelector
} from 'react-redux';
import moment from 'moment';
// import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  AreaChart,
  Area,
  // BarChart,
  // Bar,
  XAxis,
  // Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {getAggregatedStats} from '../api/aggregatedStats';
import {getProviderColor} from '../helpers/providers.js';

const prepareData = (key, data, aggregationLevel) => {
  if(! data || ! data[`${key}_aggregated_stats`] || ! data[`${key}_aggregated_stats`].values) {
    return [];
  }
  const getDateFormat = (aggregationLevel) => {
    if(aggregationLevel === 'day') {
      return 'YYYY-MM-DD';
    }
    else if(aggregationLevel === 'week') {
      return 'YYYY-[w]W';
    }
    else if(aggregationLevel === 'month') {
      return 'YYYY-MM';
    }
  }
  return data[`${key}_aggregated_stats`].values.map(x => {
    const { start_interval, ...rest } = x;
    return {...rest, ...{ name: moment(start_interval).format(getDateFormat(aggregationLevel)) }}// https://dmitripavlutin.com/remove-object-property-javascript/#2-object-destructuring-with-rest-syntax
  });
}

const getUniqueProviderNames = (object) => {
  if(! object) return [];
  return Object.keys(object).filter((key, val) => {
    return key !== 'name' ? key : false;
  })
}

class CustomizedAxisTick extends PureComponent {
  render() {
    const { x, y, payload } = this.props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
          {payload.value}
        </text>
      </g>
    );
  }
}

const renderStackedAreaChart = (data, providers) => {
  return (
    <div style={{ width: '100%', height: '400px', overflowX: 'auto', overflowY: 'hidden' }}>
      <ResponsiveContainer>
        <AreaChart
          height={400}
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" height={100} tick={<CustomizedAxisTick />} />
          <YAxis />
          <Tooltip />
          {getUniqueProviderNames(data[0]).map(x => {
            const providerColor = getProviderColor(providers, x)
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
      </ResponsiveContainer>
    </div>
  )
}

// const renderStackedBarChart = (data, providers) => {
//   return <BarChart
//     width={800}
//     height={400}
//     data={data}
//     margin={{
//       top: 20,
//       right: 30,
//       left: 20,
//       bottom: 5,
//     }}
//   >
//     <CartesianGrid strokeDasharray="3 3" />
//     <XAxis dataKey="name" />
//     <YAxis />
//     <Tooltip />
//     <Legend />
//     {getUniqueProviderNames(data[0]).map(x => {
//       const providerColor = getProviderColor(providers, x)
//       return (
//         <Bar
//           key={x}
//           stackId="1"
//           type="monotone"
//           dataKey={x}
//           stroke={providerColor}
//           fill={providerColor}
//           isAnimationActive={false}
//         />
//       )
//     })}
//   </BarChart>
// }

function StatsPage(props) {
  const token = useSelector(state => state.authentication.user_data.token)
  const filter = useSelector(state => state.filter)
  const metadata = useSelector(state => state.metadata)

  const [vehiclesData, setVehiclesData] = useState([])
  const [rentalsData, setRentalsData] = useState([])
  const [aggregationLevel, setAggregationLevel] = useState('month')

  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;
    async function fetchData() {
      const availableVehicles = await getAggregatedStats(token, 'available_vehicles', {
        filter: filter,
        metadata: metadata,
        aggregationLevel: aggregationLevel
      });
      setVehiclesData(prepareData('available_vehicles', availableVehicles, aggregationLevel));
    }
    fetchData();
  }, [aggregationLevel, filter, metadata, token]);

  useEffect(() => {
    // Do not reload chart until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;
    async function fetchData() {
      const rentals = await getAggregatedStats(token, 'rentals', {
        filter: filter,
        metadata: metadata,
        aggregationLevel: aggregationLevel
      });
      setRentalsData(prepareData('rentals', rentals, aggregationLevel));
    }
    fetchData();
  }, [aggregationLevel, filter, metadata, token]);

  return (
    <div>
      <button className="mx-2" onClick={() => { setAggregationLevel('day') }}>
        day
      </button>
      <button className="mx-2" onClick={() => { setAggregationLevel('week') }}>
        week
      </button>
      <button className="mx-2" onClick={() => { setAggregationLevel('month') }}>
        month
      </button>
      <h1 className="text-4xl my-2">Beschikbare voertuigen</h1>
      {renderStackedAreaChart(vehiclesData, metadata.aanbieders)}
      <h1 className="text-4xl my-2">Verhuringen</h1>
      {renderStackedAreaChart(rentalsData, metadata.aanbieders)}
    </div>
  )
}

export default StatsPage;
