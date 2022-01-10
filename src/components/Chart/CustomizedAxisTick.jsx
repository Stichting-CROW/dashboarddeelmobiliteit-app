import {PureComponent } from 'react';

class CustomizedXAxisTick extends PureComponent {
  render() {
    const { x, y, payload } = this.props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" transform="rotate(0)" fontSize="0.8em">
          {payload.value}
        </text>
      </g>
    );
  }
}

class CustomizedYAxisTick extends PureComponent {
  render() {
    const { x, y, payload } = this.props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={-4} y={0} dy={3} textAnchor="end" fill="#666" transform="rotate(0)" fontSize="0.8em">
          {payload.value}
        </text>
      </g>
    );
  }
}

export {
  CustomizedXAxisTick,
  CustomizedYAxisTick
}
