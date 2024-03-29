import { useState } from 'react';
import {
  // useDispatch,
  // useSelector
} from 'react-redux';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';
import { format, addDays, addMonths }  from 'date-fns';
import moment from 'moment';

// import './css/FilteritemDatumVanTot.css';

function DateFromTo(props) {
  // const dispatch = useDispatch()

  const [startDate, setStartDate] = useState(props.startDate || moment().toDate());
  const [endDate, setEndDate] = useState(props.endDate || moment().toDate());

  const [isOpen, setIsOpen] = useState(false);

  const onChange = (dates) => {
    const [start, end] = dates;

    setStartDate(start);
    setEndDate(end);
    
    props.onChange(dates)

    if(null!==end) {
      setIsOpen(!isOpen);
    }
  };
  
  const handleClick = (e) => {
    e.preventDefault();
    
    if(isOpen && endDate===null) {
      // setStartDate()
      // setEndDate()
    }
    
    setIsOpen(!isOpen);
  };
  
  const moveFilterDatum = (down) => {
    let filterOntwikkelingAggregatie = 'week';

    let start = startDate;
    let end = endDate;
    switch(filterOntwikkelingAggregatie) {
      case 'week':
        start = addDays(startDate, down?-7:7);
        end = addDays(endDate, down?-7:7);
        break;
      case 'month':
        start = addMonths(startDate, down?-1:1);
        end = addMonths(endDate, down?-1:1);
        break;
      case 'day':
      default:
        start = addDays(startDate, down?-1:1);
        end = addDays(endDate, down?-1:1);
        break;
    }
  
    setStartDate(start)
    setEndDate(end)
  }

  const setView = (view) => {
    // strip hours
    const today = new Date((new Date()).toDateString());

    let start;
    let end;
    let agg;
    switch(view) {
      case 'vandaag':
        start = today;
        end = today;
        agg='15m';
        break;
      case 'laatste2dagen':
        start = addDays(today,-1);
        end = today;
        agg='15m';
        break;
      case 'laatste7dagen':
        start = addDays(today,-6);
        end = today;
        // agg='day';
        break;
      case 'laatste30dagen':
        start = addDays(today,-30);
        end = today;
        // agg='day';
        break;
      case 'laatste90dagen':
        start = addDays(today,-90);
        end = today;
        // agg='day';
        break;
      case 'laatste12maanden':
        start = addDays(today,-365);
        end = today;
        // agg='week';
        break;
      case 'ditjaar':
        let tyear= today.getFullYear();
        start = new Date(tyear.toString() + '/1/1');
        end = today;
        // agg='month';
        break;
      case 'vorigjaar':
        let lyear= today.getFullYear()-1;
        start = new Date(lyear.toString() + '/1/1');
        end = new Date(lyear.toString() + '/12/31');
        // agg='month';
        break;
      default:
        return; // do nothing
    }
    
    onChange([start, end])
  }

  const renderPickerInline = () => {
    return (
      <div className="filter-datum-van-tot-pickercontainer">
        <DatePicker
          key="dp-van-tot"
          className="filter-datum-van-tot-picker"
          selected={startDate}
          onChange={onChange}
          startDate={startDate}
          endDate={endDate}
          dateFormat="yyyy-MM-dd"
          selectsRange
          inline
        />
        <div className="filter-datum-van-tot-picker-options">
          <div key="fdvt-po1" className="filter-datum-van-tot-option" onClick={() => { setView('vandaag')}}>Vandaag</div>
          <div key="fdvt-po2" className="filter-datum-van-tot-option" onClick={() => { setView('laatste2dagen')}}>Laatste 2 dagen</div>
          <div key="fdvt-po3" className="filter-datum-van-tot-option" onClick={() => { setView('laatste7dagen')}}>Laatste 7 dagen</div>
          <div key="fdvt-po4" className="filter-datum-van-tot-option" onClick={() => { setView('laatste30dagen')}}>Laatste 30 dagen</div>
          <div key="fdvt-po5" className="filter-datum-van-tot-option" onClick={() => { setView('laatste90dagen')}}>Laatste 90 dagen</div>
          <div key="fdvt-po6" className="filter-datum-van-tot-option" onClick={() => { setView('laatste12maanden')}}>Laatste 12 maanden</div>
          <div key="fdvt-po7" className="filter-datum-van-tot-option" onClick={() => { setView('ditjaar')}}>Dit jaar</div>
          <div key="fdvt-po8" className="filter-datum-van-tot-option" onClick={() => { setView('vorigjaar')}}>Vorig jaar </div>
        </div>
      </div>
    )
  }
    
  return (
    <div className="filter-datum-van-tot-container" style={{paddingTop: '0.5rem', paddingBottom: '0.5rem'}}>
      <div className="filter-datum-van-tot-title">
        {props.label}
      </div>
      <div className="filter-datum-van-tot-box-row">
        <div className="flex flex-col justify-center"><div
          className="filter-datum-caret"
          onClick={() => {moveFilterDatum(true)}}>
          &lsaquo;
        </div></div>
        <div className="filter-datum-van-tot-input"
          onClick={handleClick}
          >
          {startDate!==null?format(startDate, "yyyy-MM-dd"):""}
          &nbsp;t/m&nbsp;
          {endDate!==null?format(endDate, "yyyy-MM-dd"):""} </div>
        <div className="flex flex-col justify-center"><div
          className="filter-datum-caret"
          onClick={() => {moveFilterDatum(false)}}
          >
          &rsaquo;
        </div></div>
      </div>
      { isOpen && renderPickerInline() }
    </div>
  )
}

export default DateFromTo;
