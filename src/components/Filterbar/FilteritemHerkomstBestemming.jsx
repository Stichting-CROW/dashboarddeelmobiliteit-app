import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemHerkomstBestemming.css';

export default function FilteritemHerkomstBestemming() {
  const dispatch = useDispatch()

  const filterHerkomstBestemming = useSelector(state => {
    let value = 'herkomst';
    if(state.filter) {
      value=state.filter.herkomstbestemming==='bestemming' ? 'bestemming':'herkomst';
    }
    return value;
  });
  
  const setFilterHerkomstBestemming = (value) => e => {
    dispatch({ type: 'SET_FILTER_HERKOMSTBESTEMMING', payload: value })
  }
  
  let classNameHerkomst = 'filter-herkomst-bestemming-button'
  let classNameBestemming = 'filter-herkomst-bestemming-button'
  if(filterHerkomstBestemming==='bestemming') {
    classNameBestemming+=' filter-herkomst-bestemming-button-active'
  } else {
    classNameHerkomst+=' filter-herkomst-bestemming-button-active'
  }
  
  return (
    <div className="filter-herkomst-bestemming-container">
      <div className="filter-herkomst-bestemming-box-row">
        <div className={classNameHerkomst} onClick={setFilterHerkomstBestemming('herkomst')}>Herkomst</div>
        <div className={classNameBestemming} onClick={setFilterHerkomstBestemming('bestemming')}>Bestemming</div>
      </div>
    </div>
  )
}