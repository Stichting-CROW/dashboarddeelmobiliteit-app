import { useState } from 'react';
import './css/FilteritemDatumVanTot.css';
import { useDispatch, useSelector } from 'react-redux';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';

function FilterItemDatumVanTot() {
  const dispatch = useDispatch()

  const filterOntwikkelingVan = useSelector(state => {
    // console.log("filter van set to ", state.filter)
    return state.filter && state.filter.ontwikkelingvan ? new Date(state.filter.ontwikkelingvan) : new Date();
  });
  
  const filterOntwikkelingTot = useSelector(state => {
    // console.log("filter tot set to ", state.filter)
    return state.filter && state.filter.ontwikkelingtot ? new Date(state.filter.ontwikkelingtot) : new Date();
  });

  const [startDate, setStartDate] = useState(filterOntwikkelingVan);
  const [endDate, setEndDate] = useState(filterOntwikkelingTot);

  const onChange = (dates) => {
    console.log(dates);
    
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    if(null!==end) {
      // strip hours
      const van = new Date(start.toDateString());

      // strip hours, add 24 h
      let tot = new Date(end.toDateString()) ;
      tot.setDate(tot.getDate() + 1);
      dispatch({
        type: 'SET_FILTER_ONTWIKKELING_VANTOT',
        payload: { van: van.toISOString(), tot: tot.toISOString() }
      })
    }
  };
    
  return (
    <div className="filter-datum-van-tot-container">
      <div className="filter-datum-van-tot-title">Periode</div>
      <div className="filter-datum-van-tot-box-row">
        <DatePicker
          className="filter-datum-van-tot-picker"
          selected={startDate}
          onChange={onChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
         />
      </div>
    </div>
  )
}

export default FilterItemDatumVanTot;
