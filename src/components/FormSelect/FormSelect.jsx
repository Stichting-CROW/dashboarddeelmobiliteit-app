import { useState } from 'react';

import './FormSelect.css';

function FormSelect({label, options}) {
  return <div className="FormSelect my-2">
    <div className="filter-datum-van-tot-title">
      {label}
    </div>
    <select>
      {options.map(x => {
        return <option value={x.value}>
          {x.title}
        </option>
      })}
    </select>
  </div>
}

export default FormSelect;
