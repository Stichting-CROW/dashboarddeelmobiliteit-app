import { useState } from 'react';
import './Filterbar.css';
import { useDispatch, useSelector } from 'react-redux';
import ModalBox from './ModalBox.jsx';

function FilterItemDatum() {
  const dispatch = useDispatch()
  
  const filterDatum = useSelector(state => {
    return state.filter ? state.filter.datum : new Date().toISOString();
  });
  
  let [showSelectDatum, setShowSelectDatum] = useState(false);
  
  const setFilterDatum = e => {
    e.preventDefault();
    
    if (!e.target['validity'].valid) return;
    
    datum = (new Date(e.target.value)).toISOString();
    dispatch({
      type: 'SET_FILTER_DATUM',
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
  
  const renderSelectDatum = () => {
    const value = toDatetimeLocal(filterDatum);
    return (
       <ModalBox className="min-width-48" closeFunction={setShowSelectDatum}>
       <div className="filter-form-selectie">
         <div className="filter-form-title">Selecteer Datum</div>
         <form className="h-12 w-auto flex flex-row border-solid border-4 border-light-blue-500 box-border">
           <input className="bg-transparent flex-2 flex-grow" type="datetime-local" value={value} onChange={setFilterDatum} />
           <div className="flex-2"/>
         </form>
         <div className="flex-none closebutton text-center mt-4" onClick={e=>setShowSelectDatum(false)}>OK</div>
       </div>
      </ModalBox>);
  }

  let datum = new Date(filterDatum).toLocaleString();
  
  return (
    <>
      <div className="filter-item" onClick={e=>{setShowSelectDatum(!showSelectDatum)}}>
        <div className="filter-title">Datum</div>
        <div className="filter-value">{datum}</div>
      </div>
      { showSelectDatum ? renderSelectDatum() : null }
    </>
  )
}

export default FilterItemDatum;
