import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './css/FilteritemHerkomstBestemming.css';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_OTHER,
} from '../../reducers/layers.js';

export default function FilteritemHerkomstBestemming() {
  const dispatch = useDispatch()

  const viewRentals = useSelector(state => {
    return state.layers ? state.layers.view_rentals : null;
  });

  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const filterHerkomstBestemming = useSelector(state => {
    let value = 'herkomst';
    if(state.filter) {
      value=state.filter.herkomstbestemming==='bestemming' ? 'bestemming':'herkomst';
    }
    return value;
  });
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');

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
      {is_hb_view && <p className="my-2 px-4">
        {filterHerkomstBestemming==='herkomst' && <small>
          Je ziet nu waar men vandaan kwam, voordat men reisde naar het door jou geselecteerde vlak.
        </small>}

        {filterHerkomstBestemming==='bestemming' && <small>
          Je ziet nu waar men naartoe reisde, vanaf het door jou geselecteerd vlak.
        </small>}
      </p>}
    </div>
  )
}
