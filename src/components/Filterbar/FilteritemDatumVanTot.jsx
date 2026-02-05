import { useState, useEffect } from 'react';
import './css/FilteritemDatumVanTot.css';
import { useDispatch, useSelector } from 'react-redux';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';
import { format, addDays, addMonths } from 'date-fns';
import moment from 'moment';

import {StateType} from '../../types/StateType';

const setQueryParam = (key, val) => {
  let searchParams = new URLSearchParams(window.location.search);
  if(! val) {
    searchParams.delete(key);
  } else {
    searchParams.set(key, val);
  }
  if (window.history.replaceState) {
    const url = window.location.protocol 
                + "//" + window.location.host 
                + window.location.pathname 
                + (searchParams.toString() ? "?" : "")
                + searchParams.toString();
    window.history.replaceState({ path: url }, "", url)
  }
}

function FilterItemDatumVanTot({ presetButtons, defaultStartDate, defaultEndDate }) {
  const dispatch = useDispatch()

  const filterOntwikkelingVan = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingvan ? new Date(state.filter.ontwikkelingvan) : moment().subtract(30, 'days').toDate();
  });
  
  const filterOntwikkelingTot = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingtot ? new Date(state.filter.ontwikkelingtot) : new Date();
  });

  const filterOntwikkelingAggregatie = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingaggregatie ? state.filter.ontwikkelingaggregatie : 'day';
  });

  // Use default dates if provided, otherwise fall back to Redux state
  const initialStartDate = defaultStartDate || filterOntwikkelingVan;
  const initialEndDate = defaultEndDate || filterOntwikkelingTot;

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isOpen, setIsOpen] = useState(false);

  const setAggregationLevel = (newlevel) => {
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
      payload: newlevel
    })
  }

  const updateFilter = (start, end, aggregatie=false) => {
    // strip hours
    const van = new Date(start.toDateString());

    // strip hours, add 24 h
    let tot = new Date(end.toDateString());
    // tot.setDate(tot.getDate() + 1);
    dispatch({
      type: 'SET_FILTER_ONTWIKKELING_VANTOT',
      payload: { van: van.toISOString(), tot: tot.toISOString() }
    })
    
    // Update URL parameters
    setQueryParam('start_date', moment(van).format('YYYY-MM-DD'));
    setQueryParam('end_date', moment(tot).format('YYYY-MM-DD'));
    
    if(aggregatie!==false) {
      dispatch({
        type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
        payload: aggregatie
      })
    }
  }

  // Initialize from URL parameters on mount, or use defaults if no URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    
    if (startDateParam && endDateParam) {
      const start = moment(startDateParam, 'YYYY-MM-DD');
      const end = moment(endDateParam, 'YYYY-MM-DD');
      
      if (start.isValid() && end.isValid()) {
        const startDateObj = start.toDate();
        const endDateObj = end.toDate();
        
        // Only update if URL params differ from current Redux state
        const currentStart = moment(filterOntwikkelingVan).format('YYYY-MM-DD');
        const currentEnd = moment(filterOntwikkelingTot).format('YYYY-MM-DD');
        
        if (startDateParam !== currentStart || endDateParam !== currentEnd) {
          setStartDate(startDateObj);
          setEndDate(endDateObj);
          updateFilter(startDateObj, endDateObj);
        }
      }
    } else if (defaultStartDate && defaultEndDate) {
      // No URL params, but defaults are provided - always use them to ensure consistency
      // This ensures that when visiting the page without URL params, defaults are always set
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      updateFilter(defaultStartDate, defaultEndDate);
    }
  }, []); // Only run on mount

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
        agg='day';
        break;
      case 'laatste14dagen':
        start = addDays(today,-13);
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
      case 'laatste7dagen_yesterday':
        start = addDays(today,-7);
        end = addDays(today,-1);
        agg='day';
        break;
      case 'laatste14dagen_yesterday':
        start = addDays(today,-14);
        end = addDays(today,-1);
        agg='day';
        break;
      case 'laatste30dagen_yesterday':
        start = addDays(today,-30);
        end = addDays(today,-1);
        agg='day';
        break;
      case 'laatste90dagen_yesterday':
        start = addDays(today,-90);
        end = addDays(today,-1);
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
    
    setAggregationLevel(agg);

    setStartDate(start)
    setEndDate(end)
    
    updateFilter(start, end, agg);
  }

  const renderPickerInline = () => {
    // Default preset buttons
    const defaultPresets = [
      { key: 'fdvt-po1', view: 'vandaag', label: 'Vandaag' },
      { key: 'fdvt-po2', view: 'laatste2dagen', label: 'Laatste 2 dagen' },
      { key: 'fdvt-po3', view: 'laatste7dagen', label: 'Laatste 7 dagen' },
      { key: 'fdvt-po4', view: 'laatste30dagen', label: 'Laatste 30 dagen' },
      { key: 'fdvt-po5', view: 'laatste90dagen', label: 'Laatste 90 dagen' },
      { key: 'fdvt-po6', view: 'laatste12maanden', label: 'Laatste 12 maanden' },
      { key: 'fdvt-po7', view: 'ditjaar', label: 'Dit jaar' },
      { key: 'fdvt-po8', view: 'vorigjaar', label: 'Vorig jaar' },
    ];

    // Use custom preset buttons if provided, otherwise use defaults
    const presetsToRender = presetButtons || defaultPresets;

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
          {presetsToRender.map((preset, index) => (
            <div 
              key={preset.key || `fdvt-po${index + 1}`} 
              className="filter-datum-van-tot-option" 
              onClick={() => { setView(preset.view) }}
            >
              {preset.label}
            </div>
          ))}
        </div>
      </div>
    )
  }
    
  return (
    <div className="filter-datum-van-tot-container">
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
