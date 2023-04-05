import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemHerkomstBestemming.css';

import {StateType} from '../../types/StateType';

export default function FilteritemH3Niveau() {
  const dispatch = useDispatch()

  const filterHerkomstBestemming = useSelector((state: StateType) => {
    let value = 7;
    if(state.filter) {
      value=state.filter.h3niveau === 7 ? 7 : 8;
    }
    return value;
  });
  
  const setFilterH3Niveau = (value) => e => {
    dispatch({ type: 'SET_FILTER_H3NIVEAU', payload: value })
  }
  
  let classNameWijk = 'filter-herkomst-bestemming-button'
  let className7 = 'filter-herkomst-bestemming-button'
  let className8 = 'filter-herkomst-bestemming-button'
  if(filterHerkomstBestemming==='wijk') {
    classNameWijk+=' filter-herkomst-bestemming-button-active'
  } else if(filterHerkomstBestemming===7) {
    className7+=' filter-herkomst-bestemming-button-active'
  } else {
    className8+=' filter-herkomst-bestemming-button-active'
  }
  
  return (
    <div className="filter-herkomst-bestemming-container">
      <div className="filter-herkomst-bestemming-box-row">
        <div className={classNameWijk} onClick={setFilterH3Niveau('wijk')}>Wijk</div>
        <div className={className7} onClick={setFilterH3Niveau(7)}>H3 x7</div>
        <div className={className8} onClick={setFilterH3Niveau(8)}>H3 x8</div>
      </div>
    </div>
  )
}
