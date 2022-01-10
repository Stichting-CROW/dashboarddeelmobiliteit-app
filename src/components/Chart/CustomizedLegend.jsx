import {PureComponent } from 'react';

class CustomizedLegend extends PureComponent {
  render(props) {
    const { payload } = props;

    return (
      <ul>
        {
          payload.map((entry, index) => (
            <li key={`item-${index}`}>{entry.value}</li>
          ))
        }
      </ul>
    );
  }
}

export {
  CustomizedLegend
}
