import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemHerkomstBestemming.css';

export default function FilteritemH3Niveau() {
  const dispatch = useDispatch()

  const filterHerkomstBestemming = useSelector(state => {
    let value = 'h7';
    if(state.filter) {
      value=state.filter.h3niveau === 'h3-7' ? 'h3-7' : 'h3-8';
    }
    return value;
  });
  
  const setFilterH3Niveau = (value) => e => {
    dispatch({ type: 'SET_FILTER_H3NIVEAU', payload: value })
  }
  
  let className7 = 'filter-herkomst-bestemming-button'
  let className8 = 'filter-herkomst-bestemming-button'
  if(filterHerkomstBestemming==='h3-7') {
    className7+=' filter-herkomst-bestemming-button-active'
  } else {
    className8+=' filter-herkomst-bestemming-button-active'
  }
  
  return (
    <div className="filter-herkomst-bestemming-container">
      <div className="filter-herkomst-bestemming-box-row">
        <div className={className7} onClick={setFilterH3Niveau('h3-7')}>Niveau 7</div>
        <div className={className8} onClick={setFilterH3Niveau('h3-8')}>Niveau 8</div>
      </div>
    </div>
  )
}
