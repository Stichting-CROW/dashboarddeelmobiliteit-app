import { useState } from 'react';

import './FormSelect.css';

function FormSelect({label, options, onChange}) {
  return <div className="FormSelect my-2">
    <div className="filter-datum-van-tot-title">
      {label}
    </div>
    <select onChange={onChange}>
      <option key="0"></option>
      {options.map(x => {
        return <option key={x.value} value={x.value}>
          {x.title}
        </option>
      })}
    </select>
  </div>
}

export default FormSelect;
