import './css/Filterbar.css';
import { Link } from "react-router-dom";
import {useSelector} from 'react-redux';
import moment from 'moment';
// import * as R from 'ramda';
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
// import Button from '../Button/Button';
// import FormInput from '../FormInput/FormInput';
import FilterbarZones from './FilterbarZones';

// Import API functions
import {postZone} from '../../api/zones';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

function Filterbar({
  displayMode,
  visible,
  hideLogo
}) {

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  const filter = useSelector(state => {
    return state.filter;
  });

  const filterDatum = useSelector(state => {
    return state.filter && state.filter.datum ? state.filter.datum : new Date().toISOString();
  });

  const ispark=displayMode===DISPLAYMODE_PARK;
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const iszonesadmin=displayMode===DISPLAYMODE_ZONES_ADMIN;
  const iszonespublic=displayMode===DISPLAYMODE_ZONES_PUBLIC;
  const isontwikkeling=displayMode===DISPLAYMODE_OTHER;
  
  const showdatum=isrentals||ispark||!isLoggedIn;
  const showduur=isrentals;
  const showparkeerduur=ispark;
  const showafstand=isrentals;
  const showherkomstbestemming=isrentals;
  const showvantot=isontwikkeling;
  const showvervoerstype=isrentals||ispark||!isLoggedIn;

  // Show custom zones if >= 2022-11
  // We have detailled aggregated stats from 2022-11
  const doShowCustomZones =
    moment(filter.ontwikkelingvan).unix() >= moment('2022-11-01 00:00').unix();

  let zonesToShow;
  if(isontwikkeling) {
    zonesToShow = [
      'residential_area',
    ];
    if(doShowCustomZones) {
      zonesToShow.push('custom')
    }
  } else {
    zonesToShow = [
      'residential_area',
      'custom',
      'neighborhood'
    ];
  }

  return (
    <div className="filter-bar-inner py-2">

      <div className="justify-between hidden sm:flex">
        <div style={{minWidth: '82px'}}>
          {! hideLogo && (
            ispark
              ? <Logo />
              : <Link to="/"><Logo /></Link>
          )}
        </div>
        <div className="ml-4 text-sm flex justify-center flex-col" style={{
          color: '#FD862E'
        }}>
          {/* INFO */}
        </div>
      </div> 

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

      {<FilteritemZones 
        zonesToShow={zonesToShow}
        />}

      {isLoggedIn && showparkeerduur && <FilteritemMarkersParkeerduur />}

      {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

      {isLoggedIn && showherkomstbestemming && <FilteritemHerkomstBestemming />}

      {showvervoerstype && <FilteritemVoertuigTypes />}

      {<FilteritemAanbieders />}

    </div>
  )
}

export default Filterbar;
