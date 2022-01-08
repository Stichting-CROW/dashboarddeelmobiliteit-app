import React, {useEffect, useState } from 'react';

import {
  // useDispatch,
  useSelector
} from 'react-redux';

// import moment from 'moment';

import {
  // AreaChart,
  LineChart,
  // Area,
  // BarChart,
  // Bar,
  Line,
  XAxis,
  // Legend,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {getAggregatedStats} from '../../api/aggregatedStats';
import {
  getProviderColor,
  getUniqueProviderNames
} from '../../helpers/providers.js';
import {prepareAggregatedStatsData} from '../../helpers/stats.js';

import {CustomizedXAxisTick, CustomizedYAxisTick} from '../Chart/CustomizedAxisTick.jsx';

function StatsPage(props) {
  // const dispatch = useDispatch()

  const token = useSelector(state => state.authentication.user_data.token)
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
      setRentalsData(prepareAggregatedStatsData('rentals', rentals, filter.ontwikkelingaggregatie));
    }
    fetchData();
  }, [filter, filter.ontwikkelingaggregatie, metadata, token]);
  
  return (
    <div style={{ width: '100%', height: '400px', overflowX: 'hidden', overflowY: 'hidden' }}>
      <ResponsiveContainer>
        <LineChart
          data={rentalsData}
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
          <Tooltip />
          {getUniqueProviderNames(rentalsData[0]).map(x => {
            const providerColor = getProviderColor(metadata.aanbieders, x)
            return (
              <Line
                key={x}
                stackId="1"
                dot={false}
                strokeWidth={4}
                type="monotone"
                dataKey={x}
                stroke={providerColor}
                fill={providerColor}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StatsPage;
