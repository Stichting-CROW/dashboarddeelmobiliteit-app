import {PureComponent } from 'react';

import './CustomizedTooltip.css';

const CustomizedTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {

    const sumValue = () => {
      let res = 0;
      payload.map(x => {
        res += x.value;
      })
      return res;
    }

    return (
      <div className="CustomizedTooltip">
        <div className="my-0">
          <b>{`${label}`}</b>
        </div>
        <ul className="my-0 py-0">
          {payload.map(x => {
            return <li style={{color: x.fill}}>
              {x.name}: {x.value}
            </li>
          })}
        </ul>
        <div className="my-0">
          Totaal: {sumValue()}<br />
        </div>
      </div>
    );
  }

  return null;
};

export {
  CustomizedTooltip
}
