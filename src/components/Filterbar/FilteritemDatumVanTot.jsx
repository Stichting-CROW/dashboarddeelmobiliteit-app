import { useState, useEffect } from 'react';
import './css/FilteritemDatumVanTot.css';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';
import { format, addDays, addMonths } from 'date-fns';
import moment from 'moment';

import {StateType} from '../../types/StateType';

const parseUrlDate = (dateParam) => {
  const parsed = moment(dateParam, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed.toDate() : null;
};

const getInitialDatesFromUrl = (defaultStartDate, defaultEndDate, filterOntwikkelingVan, filterOntwikkelingTot) => {
  const searchParams = new URLSearchParams(window.location.search);
  const startDateParam = searchParams.get('start_date');
  const endDateParam = searchParams.get('end_date');

  if (startDateParam && endDateParam) {
    const start = parseUrlDate(startDateParam);
    const end = parseUrlDate(endDateParam);
    if (start && end) {
      return { startDate: start, endDate: end };
    }
  }

  return {
    startDate: defaultStartDate || filterOntwikkelingVan,
    endDate: defaultEndDate || filterOntwikkelingTot,
  };
};

function FilterItemDatumVanTot({
  presetButtons,
  defaultStartDate,
  defaultEndDate,
  defaultPresetView = undefined,
  showPresetOptionsByDefault = false,
}) {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const filterOntwikkelingVan = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingvan ? new Date(state.filter.ontwikkelingvan) : moment().subtract(30, 'days').toDate();
  });
  
  const filterOntwikkelingTot = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingtot ? new Date(state.filter.ontwikkelingtot) : new Date();
  });

  const filterOntwikkelingAggregatie = useSelector((state: StateType) => {
    return state.filter && state.filter.ontwikkelingaggregatie ? state.filter.ontwikkelingaggregatie : 'day';
  });

  const initialDates = getInitialDatesFromUrl(
    defaultStartDate,
    defaultEndDate,
    filterOntwikkelingVan,
    filterOntwikkelingTot
  );

  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [isOpen, setIsOpen] = useState(false);

  const toDateKey = (date) => format(date, 'yyyy-MM-dd');

  const getPresetDateConfig = (view) => {
    const today = new Date((new Date()).toDateString());

    switch(view) {
      case 'vandaag':
        return { start: today, end: today, agg: '15m' };
      case 'laatste2dagen':
        return { start: addDays(today, -1), end: today, agg: '15m' };
      case 'laatste7dagen':
        return { start: addDays(today, -6), end: today, agg: 'day' };
      case 'laatste14dagen':
        return { start: addDays(today, -13), end: today, agg: 'day' };
      case 'laatste30dagen':
        return { start: addDays(today, -30), end: today, agg: 'day' };
      case 'laatste90dagen':
        return { start: addDays(today, -90), end: today, agg: 'day' };
      case 'laatste7dagen_yesterday':
        return { start: addDays(today, -7), end: addDays(today, -1), agg: 'day' };
      case 'laatste14dagen_yesterday':
        return { start: addDays(today, -14), end: addDays(today, -1), agg: 'day' };
      case 'laatste30dagen_yesterday':
        return { start: addDays(today, -30), end: addDays(today, -1), agg: 'day' };
      case 'laatste90dagen_yesterday':
        return { start: addDays(today, -90), end: addDays(today, -1), agg: 'day' };
      case 'laatste12maanden':
        return { start: addDays(today, -365), end: today, agg: 'week' };
      case 'ditjaar': {
        const thisYear = today.getFullYear();
        return { start: new Date(`${thisYear}/1/1`), end: today, agg: 'month' };
      }
      case 'vorigjaar': {
        const previousYear = today.getFullYear() - 1;
        return {
          start: new Date(`${previousYear}/1/1`),
          end: new Date(`${previousYear}/12/31`),
          agg: 'month'
        };
      }
      default:
        return null;
    }
  };

  const isPresetActive = (view) => {
    if (!startDate || !endDate) {
      return false;
    }

    const presetConfig = getPresetDateConfig(view);
    if (!presetConfig) {
      return false;
    }

    return (
      toDateKey(startDate) === toDateKey(presetConfig.start) &&
      toDateKey(endDate) === toDateKey(presetConfig.end)
    );
  };

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
    
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('start_date', moment(van).format('YYYY-MM-DD'));
    nextSearchParams.set('end_date', moment(tot).format('YYYY-MM-DD'));
    setSearchParams(nextSearchParams, { replace: true });
    
    if(aggregatie!==false) {
      dispatch({
        type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE',
        payload: aggregatie
      })
    }
  }

  // Initialize from URL parameters on mount, or use defaults if no URL params
  useEffect(() => {
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    
    if (startDateParam && endDateParam) {
      const startDateObj = parseUrlDate(startDateParam);
      const endDateObj = parseUrlDate(endDateParam);
      
      if (startDateObj && endDateObj) {
        setStartDate(startDateObj);
        setEndDate(endDateObj);

        const currentStart = moment(filterOntwikkelingVan).format('YYYY-MM-DD');
        const currentEnd = moment(filterOntwikkelingTot).format('YYYY-MM-DD');
        
        if (startDateParam !== currentStart || endDateParam !== currentEnd) {
          updateFilter(startDateObj, endDateObj);
        }
      }
    } else if (defaultPresetView) {
      const presetConfig = getPresetDateConfig(defaultPresetView);
      if (presetConfig) {
        const { start, end, agg } = presetConfig;
        setAggregationLevel(agg);
        setStartDate(start);
        setEndDate(end);
        updateFilter(start, end, agg);
      }
    } else if (defaultStartDate && defaultEndDate) {
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      updateFilter(defaultStartDate, defaultEndDate);
    }
  }, []); // Only run on mount

  // Keep picker in sync when URL dates change externally (e.g. back/forward
  // navigation, or another component updating the URL).
  // Important: do NOT depend on startDate/endDate here, otherwise picking the
  // first day of a custom range (which leaves endDate=null) would re-trigger
  // this effect and revert the picker before the user can pick the end date.
  useEffect(() => {
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    if (!startDateParam || !endDateParam) {
      return;
    }

    const startDateObj = parseUrlDate(startDateParam);
    const endDateObj = parseUrlDate(endDateParam);
    if (!startDateObj || !endDateObj) {
      return;
    }

    setStartDate((prev) =>
      prev && toDateKey(prev) === startDateParam ? prev : startDateObj
    );
    setEndDate((prev) =>
      prev && toDateKey(prev) === endDateParam ? prev : endDateObj
    );
  }, [searchParams]);

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
    const presetConfig = getPresetDateConfig(view);
    if (!presetConfig) {
      return;
    }
    const { start, end, agg } = presetConfig;
    
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
      { key: 'fdvt-po4', view: 'laatste30dagen', label: 'Laatste 30 d' },
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
              className={`filter-datum-van-tot-option${isPresetActive(preset.view) ? ' active' : ''}`}
              onClick={() => { setView(preset.view) }}
            >
              {preset.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPickerOptions = () => {
    // Default preset buttons
    const defaultPresets = [
      { key: 'fdvt-po1', view: 'vandaag', label: 'Vandaag' },
      { key: 'fdvt-po2', view: 'laatste2dagen', label: 'Laatste 2 dagen' },
      { key: 'fdvt-po3', view: 'laatste7dagen', label: 'Laatste 7 dagen' },
      { key: 'fdvt-po4', view: 'laatste30dagen', label: 'Laatste 30 d' },
      { key: 'fdvt-po5', view: 'laatste90dagen', label: 'Laatste 90 dagen' },
      { key: 'fdvt-po6', view: 'laatste12maanden', label: 'Laatste 12 maanden' },
      { key: 'fdvt-po7', view: 'ditjaar', label: 'Dit jaar' },
      { key: 'fdvt-po8', view: 'vorigjaar', label: 'Vorig jaar' },
    ];

    const presetsToRender = presetButtons || defaultPresets;

    return (
      <div className="filter-datum-van-tot-picker-options">
        {presetsToRender.map((preset, index) => (
          <div
            key={preset.key || `fdvt-po${index + 1}`}
            className={`filter-datum-van-tot-option${isPresetActive(preset.view) ? ' active' : ''}`}
            onClick={() => { setView(preset.view) }}
          >
            {preset.label}
          </div>
        ))}
      </div>
    );
  }
    
  return (
    <div className="filter-datum-van-tot-container">
      <div className="filter-datum-van-tot-box-row">
        <div className="filter-datum-van-tot-input"
          onClick={handleClick}>
          <div
            className="filter-datum-van-tot-caret"
            onClick={(e) => {
              e.stopPropagation();
              moveFilterDatum(true);
            }}>
            &lsaquo;
          </div>
          <div className="flex gap-2">
            <img
              className="filter-datum-van-tot-img-now"
              src="/components/FilteritemDuur/calendar-alt.svg"
              alt=""
              aria-hidden="true"
            />
            <span className="filter-datum-van-tot-period">
              {startDate!==null?format(startDate, "dd-MM-''yy"):""}
            &nbsp;t/m&nbsp;
              {endDate!==null?format(endDate, "dd-MM-''yy"):""}
            </span>
          </div>
          <div
            className="filter-datum-van-tot-caret"
            onClick={(e) => {
              e.stopPropagation();
              moveFilterDatum(false);
            }}>
            &rsaquo;
          </div>
        </div>
      </div>
      {showPresetOptionsByDefault && !isOpen && renderPickerOptions()}
      { isOpen && renderPickerInline() }
    </div>
  )
}

export default FilterItemDatumVanTot;
