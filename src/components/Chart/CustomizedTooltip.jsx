// import {PureComponent } from 'react';

import './CustomizedTooltip.css';

const CustomizedTooltip = ({
  active, payload, label
}: {
  active?: any,
  payload?: any,
  label?: any
}) => {
  if (active && payload && payload.length) {

    const arrayReverseObj = obj => Object.keys(obj).sort().reverse().map(key=> ({ ...obj[key], key }) );

    const sumValue = () => {
      let res = 0;
      payload.forEach(x => {
        res += parseInt(x.value);
      })
      return res;
    }

    return (
      <div className="CustomizedTooltip">
        <div className="my-0">
          <b>{`${label}`}</b>
        </div>
        <ul className="my-0 py-0">
          {arrayReverseObj(payload).map((x,i) => {
            return <li key={'c-'+i} style={{color: x.fill}}>
              {x.name}: {parseInt(x.value)}
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
