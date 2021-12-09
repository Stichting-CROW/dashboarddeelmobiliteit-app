import React from 'react';
import { useSelector } from 'react-redux';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

// import './StatsPagePage.css';

const data = [
  {
    name: 'Page A',
    uv: 400,
    pv: 2400,
    amt: 2400
  },
  {
    name: 'Page B',
    uv: 100,
    pv: 200,
    amt: 200
  },
  {
    name: 'Page B',
    uv: 300,
    pv: 400,
    amt: 600
  },
];

const renderLineChart = (
  <LineChart width={400} height={400} data={data}>
    <Line type="monotone" dataKey="uv" stroke="#8884d8" />
    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
    <XAxis dataKey="name" />
    <YAxis />
  </LineChart>
);

function StatsPage(props) {
  return (
    <div>
      {renderLineChart}
    </div>
  )
}

export default StatsPage;
