// import {PureComponent } from 'react';

import './CustomizedTooltip.css';

const tooltipTextColor = '#333333';

const isLightColor = (c) => {
  if (!c || typeof c !== 'string') return true;
  const s = c.replace(/\s/g, '').toLowerCase();
  if (s === 'white' || s === '#fff' || s === '#ffffff' || s.startsWith('rgb(255,255,255')) return true;
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length <= 4) return parseInt(hex, 16) > 0xff0; // #fff, #fff0
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6) || 'ff', 16);
    return (r + g + b) / 3 > 240; // very light
  }
  return false;
};

const getLineColor = (x) => {
  const c = x.color || (x.fill && x.fill !== 'transparent' ? x.fill : x.stroke) || tooltipTextColor;
  return isLightColor(c) ? tooltipTextColor : c;
};

const displayValue = (v) => (Number.isInteger(v) ? v.toString() : v.toFixed(2));

const CustomizedTooltip = ({
  active, payload, label, contentStyle = {}
}: {
  active?: any,
  payload?: any,
  label?: any,
  contentStyle?: any
}) => {
  if (active && payload && payload.length) {

    const arrayReverseObj = obj => Object.keys(obj).sort().reverse().map(key=> ({ ...obj[key], key }) );

    const hasTotaalSeries = payload.some(x => x.name === 'Totaal');
    const sumValue = () => {
      let res = 0;
      payload.forEach(x => {
        res += Number(x.value) || 0;
      });
      return res;
    };

    const rootStyle = { color: tooltipTextColor, ...contentStyle };

    return (
      <div className="CustomizedTooltip" style={rootStyle}>
        <div className="my-0" style={{ color: tooltipTextColor }}>
          <b>{`${label}`}</b>
        </div>
        <ul className="my-0 py-0">
          {arrayReverseObj(payload).map((x, i) => (
            <li key={'c-' + i} className="CustomizedTooltip-item" style={{ color: getLineColor(x) }}>
              {x.name}: {displayValue(Number(x.value))}
            </li>
          ))}
        </ul>
        {!hasTotaalSeries && (
          <div className="my-0" style={{ color: tooltipTextColor }}>
            Totaal: {displayValue(sumValue())}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export {
  CustomizedTooltip
}
