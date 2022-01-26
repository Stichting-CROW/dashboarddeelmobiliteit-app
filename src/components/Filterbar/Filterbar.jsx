import './css/Filterbar.css';
import {useSelector} from 'react-redux';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemDatumVanTot from './FilteritemDatumVanTot.jsx';
import FilteritemDuur from './FilteritemDuur.jsx';
import FilteritemAanbieders from './FilteritemAanbieders.jsx';
import FilteritemZones from './FilteritemZones.jsx';
import {
  FilteritemMarkersAfstand,
  FilteritemMarkersParkeerduur
} from './FilteritemMarkers.jsx';
import FilteritemHerkomstBestemming from './FilteritemHerkomstBestemming';
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes.jsx';
import Logo from '../Logo.jsx';
import moment from 'moment';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

function Filterbar({
    displayMode,
    visible,
    hideLogo}) {

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  const filterDatum = useSelector(state => {
    return state.filter && state.filter.datum ? state.filter.datum : new Date().toISOString();
  });

  const ispark=displayMode===DISPLAYMODE_PARK;
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const isontwikkeling=displayMode===DISPLAYMODE_OTHER;
  
  const showdatum=isrentals||ispark||!isLoggedIn;
  const showduur=isrentals;
  const showparkeerduur=ispark;
  const showafstand=isrentals;
  const showherkomstbestemming=isrentals;
  const showvantot=isontwikkeling;
  const showvervoerstype=isrentals||ispark||!isLoggedIn;
  
  return (
    <div className="filter-bar-inner py-2">

      {! hideLogo && <Logo />}
      
      { isLoggedIn && showdatum && <FilteritemDatum /> }
      
      { ! isLoggedIn && showdatum && <div>
        <div className="filter-datum-container">
          <div className="filter-datum-title">
            Tijd
          </div>
          <div className="filter-datum-box-row">
            {moment(filterDatum).format('HH:mm')}
          </div>
        </div>
      </div> }

      { isLoggedIn && showduur && <FilteritemDuur /> }

      { isLoggedIn && showvantot && <FilteritemDatumVanTot /> }

      {<FilteritemGebieden />}

      {isLoggedIn && <FilteritemZones />}

      {isLoggedIn && showparkeerduur && <FilteritemMarkersParkeerduur />}

      {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

      {isLoggedIn && showherkomstbestemming && <FilteritemHerkomstBestemming />}

      {showvervoerstype && <FilteritemVoertuigTypes />}

      {<FilteritemAanbieders />}

    </div>
  )
}

export default Filterbar;
