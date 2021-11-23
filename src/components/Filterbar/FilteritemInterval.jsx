import { useState } from 'react';
import './css/Filterbar.css';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';

function FilterItemInterval() {
  const dispatch = useDispatch()
  
  const filterIntervalStart = useSelector(state => {
    return state.filter ? state.filter.intervalstart : new Date().toISOString();
  });
  
  const filterIntervalEnd = useSelector(state => {
    return state.filter ? state.filter.intervalend : new Date().toISOString();
  });
  
  let [useIntervalStart, setUseIntervalStart] = useState(false);
  let [showSelectInterval, setShowSelectInterval] = useState(false);
  
  const setFilterInterval = e => {
    e.preventDefault();
    
    if (!e.target['validity'].valid) return;
    
    const datum = (new Date(e.target.value)).toISOString();
    dispatch({
      type: useIntervalStart ? 'SET_FILTER_INTERVAL_START':'SET_FILTER_INTERVAL_END',
      payload: datum
    })
  }
  
  // https://webreflection.medium.com/using-the-input-datetime-local-9503e7efdce
  function toDatetimeLocal(ISOString) {
    const date = new Date(ISOString)
    const
      ten = function (i) {
        return (i < 10 ? '0' : '') + i;
      },
      YYYY = date.getFullYear(),
      MM = ten(date.getMonth() + 1),
      DD = ten(date.getDate()),
      HH = ten(date.getHours()),
      II = ten(date.getMinutes()),
      SS = ten(date.getSeconds())
    ;
    return YYYY + '-' + MM + '-' + DD + 'T' +
             HH + ':' + II + ':' + SS;
  };
  
  const renderSelectInterval = (isStart) => {
    const value = toDatetimeLocal(isStart ? filterIntervalStart : filterIntervalEnd);
    return (
      <ModalBox className="min-width-48" closeFunction={setShowSelectInterval}>
        <div className="filter-form-selectie">
          <div className="filter-form-title">Selecteer Datum</div>
          <form key="f-end" className="h-12 w-auto flex flex-row border-solid border-4 border-light-blue-500 box-border">
            <input className="bg-transparent flex-2 flex-grow" type="datetime-local" value={value} onChange={setFilterInterval} />
            <div className="flex-2"/>
          </form>
          <div className="flex-none closebutton text-center mt-4" onClick={e=>setShowSelectInterval(false)}>OK</div>
        </div>
     </ModalBox>);
  }

  let intervalStart = new Date(filterIntervalStart).toLocaleString();
  let intervalEnd = new Date(filterIntervalEnd).toLocaleString();
  // console.log("got interval %s - %s", intervalStart, intervalEnd);

    //  onClick={e=>{setShowSelectInterval(!showSelectInterval)}}
  return (
    <>
    <div className="filter-item" onClick={e=>{setUseIntervalStart(true); setShowSelectInterval(true)}}>
        <div className="filter-title">Start</div>
        <div className="filter-value">{intervalStart}</div>
      </div>
      <div className="filter-item" onClick={e=>{setUseIntervalStart(false); setShowSelectInterval(true)}}>
        <div className="filter-title">Eind</div>
        <div className="filter-value">{intervalEnd}</div>
      </div>
      { showSelectInterval ?  renderSelectInterval() : null }
    </>
  )
}

export default FilterItemInterval;
