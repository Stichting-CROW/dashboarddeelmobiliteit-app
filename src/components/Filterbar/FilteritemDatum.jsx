// import { useState } from 'react';
import './css/FilteritemDatum.css';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import './css/FilteritemDatum-Timepicker.css';
import './css/FilteritemDatum-Calendar.css';
import './css/FilteritemDatum-Clock.css';

// using https://github.com/wojtekmaj/react-datetime-picker with custom styling
import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'; //
import calendarIcon from '../../images/calendar.svg';

function FilterItemDatum() {
  const dispatch = useDispatch()
  
  const filterDatum = useSelector(state => {
    return state.filter ? state.filter.datum : new Date().toISOString();
  });
  
  const setFilterDatum = newdt => {
    dispatch({
      type: 'SET_FILTER_DATUM',
      payload: newdt.toISOString()
    })
  }

  return (
    <div className="filter-datum-container">
      <div className="filter-datum-title">Datum</div>
      <div className="filter-datum-box-row">
        <div className="filter-datum-box-1">
            <div
              className="filter-datum-caret"
              onClick={() => {
                setFilterDatum(
                  moment(filterDatum).subtract(1, 'hours')
                )
              }}>
              &lsaquo;
            </div>
              <div className="filter-datum-dtpicker">
                <DateTimePicker
                  onChange={setFilterDatum}
                  value={new Date(filterDatum)}
                  clearIcon={null}
                  calendarIcon={<img src={calendarIcon} alt="Logo" />}
                  format={"y-MM-dd H:mm"}/>
              </div>
            <div
              className="filter-datum-caret"
              onClick={() => {
                setFilterDatum(
                  moment(filterDatum).add(1, 'hours')
                )
              }}
              >&rsaquo;</div>
        </div>
        <div className="filter-datum-box-2" onClick={() => {
          setFilterDatum(new Date())
        }} title="Laad huidige datum en tijd">
          <div className="filter-datum-img-play" />
        </div>
      </div>
    </div>
  )
}

export default FilterItemDatum;
