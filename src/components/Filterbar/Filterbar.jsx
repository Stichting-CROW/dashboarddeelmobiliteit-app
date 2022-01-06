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
  
  const ispark=displayMode===DISPLAYMODE_PARK;
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const isontwikkeling=displayMode===DISPLAYMODE_OTHER;
  
  const showdatum=isrentals||ispark;
  const showduur=isrentals;
  const showparkeerduur=ispark||isontwikkeling;
  const showafstand=isrentals;
  const showherkomstbestemming=isrentals;
  const showvantot=isontwikkeling;
  
  return (
    <div className="filter-bar-inner py-2">

      {! hideLogo && <Logo />}
      
      { isLoggedIn && showdatum && <FilteritemDatum /> }

      { isLoggedIn && showduur && <FilteritemDuur /> }

      { isLoggedIn && showvantot && <FilteritemDatumVanTot /> }

      {<FilteritemGebieden />}

      {<FilteritemZones />}

      {isLoggedIn && showparkeerduur && <FilteritemMarkersParkeerduur />}

      {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

      {isLoggedIn && showherkomstbestemming && <FilteritemHerkomstBestemming />}

      {<FilteritemVoertuigTypes />}

      {<FilteritemAanbieders />}

    </div>
  )
}

export default Filterbar;
