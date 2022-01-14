import { useEffect } from 'react';
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
    if(state.layers.displaymode === 'displaymode-rentals') {
      return state.filter && state.filter.intervalend ? state.filter.intervalend : new Date().toISOString();
    } else {
      return state.filter && state.filter.datum ? state.filter.datum : new Date().toISOString();
    }
  });

  // On Component load: set filter datum if filterdatum is undefined
  useEffect(x => {
    setFilterDatum(new Date(filterDatum));
  }, [])

  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : null;
  });

  const setFilterDatum = newdt => {
    if(displayMode === 'displaymode-rentals') {
      dispatch({
        type: 'SET_FILTER_INTERVAL_END',
        payload: newdt.toISOString()
      })
      return;
    }
    dispatch({
      type: 'SET_FILTER_DATUM',
      payload: newdt.toISOString()
    })
  }

  return (
    <div className="filter-datum-container">
      <div className="filter-datum-title">
        {displayMode === 'displaymode-rentals' ? 'Eindtijd' : 'Datum'}
      </div>
      <div className="filter-datum-box-row">
        <div className="filter-datum-box-1">
          <div className="flex flex-col justify-center"><div
            className="filter-datum-caret"
            onClick={() => {
              setFilterDatum(
                moment(filterDatum).subtract(1, 'hours')
              )
            }}>
            &lsaquo;
          </div></div>
          <div className="filter-datum-dtpicker">
            <DateTimePicker
              onChange={setFilterDatum}
              value={new Date(filterDatum)}
              clearIcon={null}
              calendarIcon={<img src={calendarIcon} alt="Logo" />}
              format={"y-MM-dd H:mm"}
            />
          </div>
          <div className="flex flex-col justify-center"><div
            className="filter-datum-caret"
            onClick={() => {
              setFilterDatum(
                moment(filterDatum).add(1, 'hours')
              )
            }}
            >&rsaquo;</div></div>
        </div>
        <div className="filter-datum-box-2" onClick={() => {
          setFilterDatum(new Date())
        }} title="Toon huidige datum en tijd">
          <div className="filter-datum-img-now" />
        </div>
      </div>
    </div>
  )
}

export default FilterItemDatum;
