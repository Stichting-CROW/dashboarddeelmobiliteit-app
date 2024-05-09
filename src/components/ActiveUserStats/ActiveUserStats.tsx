import React from 'react';

import {
    BarChart,
    Bar,
    XAxis,
    Legend,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
  } from 'recharts';
  
  const ActiveUserStats = () => {
    const stats = [{
        date: '2024-04-25',
        admin: 1,
        municipality: 5,
        operator: 2
    }, {
        date: '2024-04-26',
        admin: 3,
        municipality: 3,
        operator: 3
    }];

    return (
        <div>
            <BarChart
                data={stats}
                width={500}
                height={300}
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                }}
                >
                <CartesianGrid strokeDasharray="3 0" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                    dataKey={'admin'}
                    stackId="1"
                    type="monotone"
                    stroke={'#000'}
                    fill={'#00f'}
                    isAnimationActive={false}
                />
                <Bar
                    dataKey={'municipality'}
                    stackId="1"
                    type="monotone"
                    stroke={'#000'}
                    fill={'#0f0'}
                    isAnimationActive={false}
                />
                <Bar
                    dataKey={'operator'}
                    stackId="1"
                    type="monotone"
                    stroke={'#000'}
                    fill={'#f00'}
                    isAnimationActive={false}
                />
            </BarChart>
        </div>
    )
}

export default ActiveUserStats;
