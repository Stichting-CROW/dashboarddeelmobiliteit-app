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
import FilteritemH3Niveau from './FilteritemH3Niveau.jsx';
import {
  FilteritemMarkersAfstand,
  FilteritemMarkersParkeerduur
} from './FilteritemMarkers.jsx';
import FilteritemHerkomstBestemming from './FilteritemHerkomstBestemming';
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes.jsx';
import Logo from '../Logo.jsx';
import Button from '../Button/Button';
import Fieldset from '../Fieldset/Fieldset';

// Import API functions
import {postZone} from '../../api/zones';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

const Weekdays = () => {
  const weekdays = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  const weekdayTitles = [
    'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'
  ];

  return (
    <div>

      {weekdays.map((x, idx) => {
        return <Button key={idx} theme={'white'}>
          {weekdayTitles[idx].toLowerCase()}
        </Button>
      })}


    </div>
  );
}

const Timeframes = () => {
  return (
    <Button theme={'white'}>
      2-6
    </Button>
  )
}

function FilterbarHb({
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
  const showvantot=isontwikkeling || true;
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

      <br />

      <Fieldset title="Plaats">
        <FilteritemGebieden />
      </Fieldset>

      <Fieldset title="Periode">
        <FilteritemDatumVanTot />
      </Fieldset>

      <Fieldset title="Weekdag">
        <Weekdays />
      </Fieldset>

      <Fieldset title="Tijdvak">
        <Timeframes />
      </Fieldset>

      <Fieldset title="Vervoerstype">
        <FilteritemVoertuigTypes />
      </Fieldset>

      <Fieldset title="Detailniveau">
        <FilteritemH3Niveau />
      </Fieldset>

      <Fieldset title="Herkomst of bestemming?">
        <FilteritemHerkomstBestemming />
      </Fieldset>

    </div>
  )
}

export default FilterbarHb;
