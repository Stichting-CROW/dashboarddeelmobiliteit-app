import { useState } from 'react';
import './css/FilteritemDatumVanTot.css';
import { useDispatch, useSelector } from 'react-redux';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';
import { format, addDays, addMonths }  from 'date-fns';

function FilterItemDatumVanTot() {
  const dispatch = useDispatch()

  const filterOntwikkelingVan = useSelector(state => {
    return state.filter && state.filter.ontwikkelingvan ? new Date(state.filter.ontwikkelingvan) : new Date();
  });
  
  const filterOntwikkelingTot = useSelector(state => {
    return state.filter && state.filter.ontwikkelingtot ? new Date(state.filter.ontwikkelingtot) : new Date();
  });

  const filterOntwikkelingAggregatie = useSelector(state => {
    return state.filter && state.filter.ontwikkelingaggregatie ? state.filter.ontwikkelingaggregatie : 'day';
  });

  const [startDate, setStartDate] = useState(filterOntwikkelingVan);
  const [endDate, setEndDate] = useState(filterOntwikkelingTot);
  const [isOpen, setIsOpen] = useState(false);


  const updateFilter = (start, end, aggregatie=false) => {
    // strip hours
    const van = new Date(start.toDateString());

    // strip hours, add 24 h
    let tot = new Date(end.toDateString()) ;
    // tot.setDate(tot.getDate() + 1);
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_VANTOT',
      payload: { van: van.toISOString(), tot: tot.toISOString() }
    })
    
    if(aggregatie!==false) {
      dispatch({
        type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
        payload: aggregatie
      })
    }
  }
  const onChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    if(null!==end) {
      updateFilter(start, end);
      setIsOpen(!isOpen);
    }
  };
  
  const handleClick = (e) => {
    e.preventDefault();
    
    if(isOpen && endDate===null) {
      setStartDate(filterOntwikkelingVan)
      setEndDate(filterOntwikkelingTot)
    }
    
    setIsOpen(!isOpen);
  };
  
  // const moveFilterDatum = (down) => {
  //   let start = startDate;
  //   let end = endDate;
  //   switch(filterOntwikkelingAggregatie) {
  //     case 'week':
  //       start = addDays(startDate, down?-7:7);
  //       end = addDays(endDate, down?-7:7);
  //       break;
  //     case 'month':
  //       start = addMonths(startDate, down?-1:1);
  //       end = addMonths(endDate, down?-1:1);
  //       break;
  //     case 'day':
  //     default:
  //       start = addDays(startDate, down?-1:1);
  //       end = addDays(endDate, down?-1:1);
  //       break;
  //   }
  //
  //   setStartDate(start)
  //   setEndDate(end)
  //
  //   updateFilter(start, end);
  // }
  
  const moveFilterDatum = (movestart) => {
    let start = startDate;
    let end = endDate;
    if(movestart) {
      switch(filterOntwikkelingAggregatie) {
        case 'week':
          start = addDays(startDate, -7);
          break;
        case 'month':
          start = addMonths(startDate, -1);
          break;
        case 'day':
        default:
          start = addDays(startDate, -1);
          break;
      }
    } else {
      switch(filterOntwikkelingAggregatie) {
        case 'week':
          end = addDays(endDate, 7);
          break;
        case 'month':
          end = addMonths(endDate, 1);
          break;
        case 'day':
        default:
          end = addDays(endDate, 1);
          break;
      }
    }
    
    setStartDate(start)
    setEndDate(end)
    
    updateFilter(start, end);
  }
  
  
  const setView = (view) => {
    // strip hours
    const today = new Date((new Date()).toDateString());

    let start;
    let end;
    let agg;
    switch(view) {
      case 'laatste7dagen':
        start = addDays(today,-6);
        end = today;
        agg='day';
        break;
      case 'laatste30dagen':
        start = addDays(today,-30);
        end = today;
        agg='day';
        break;
      case 'laatste90dagen':
        start = addDays(today,-90);
        end = today;
        agg='day';
        break;
      case 'laatste12maanden':
        start = addDays(today,-365);
        end = today;
        agg='week';
        break;
      case 'ditjaar':
        let tyear= today.getFullYear();
        start = new Date(tyear.toString() + '/1/1');
        end = today;
        agg='month';
        break;
      case 'vorigjaar':
        let lyear= today.getFullYear()-1;
        start = new Date(lyear.toString() + '/1/1');
        end = new Date(lyear.toString() + '/12/31');
        agg='month';
        break;
      default:
        return; // do nothing
    }
    
    setStartDate(start)
    setEndDate(end)
    
    updateFilter(start, end, agg);
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
          <div key="fdvt-po1" className="filter-datum-van-tot-option" onClick={() => { setView('laatste7dagen')}}>Laatste 7 dagen</div>
          <div key="fdvt-po2" className="filter-datum-van-tot-option" onClick={() => { setView('laatste30dagen')}}>Laatste 30 dagen</div>
          <div key="fdvt-po3" className="filter-datum-van-tot-option" onClick={() => { setView('laatste90dagen')}}>Laatste 90 dagen</div>
          <div key="fdvt-po4" className="filter-datum-van-tot-option" onClick={() => { setView('laatste12maanden')}}>Laatste 12 maanden</div>
          <div key="fdvt-po5" className="filter-datum-van-tot-option" onClick={() => { setView('ditjaar')}}>Dit jaar</div>
          <div key="fdvt-po6" className="filter-datum-van-tot-option" onClick={() => { setView('vorigjaar')}}>Vorig jaar </div>
        </div>
      </div>
    )
  }
    
  return (
    <div className="filter-datum-van-tot-container">
      <div className="filter-datum-van-tot-title">Periode</div>
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

export default FilterItemDatumVanTot;
