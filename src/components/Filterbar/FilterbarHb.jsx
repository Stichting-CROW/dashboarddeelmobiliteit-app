import './css/Filterbar.css';
import { Link } from "react-router-dom";
import {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemDatumVanTot from './FilteritemDatumVanTot.jsx';
import FilteritemDuur from './FilteritemDuur.jsx';
import FilteritemAanbieders from './FilteritemAanbieders';
import FilteritemZones from './FilteritemZones.jsx';
import FilteritemH3Niveau from './FilteritemH3Niveau.jsx';
import {
  FilteritemMarkersAfstand,
  FilteritemMarkersParkeerduur
} from './FilteritemMarkers.jsx';
import FilteritemHerkomstBestemming from './FilteritemHerkomstBestemming';
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes';
import Logo from '../Logo.jsx';
import Button from '../Button/Button';
import Fieldset from '../Fieldset/Fieldset';

import {StateType} from '../../types/StateType';

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
  const dispatch = useDispatch();

  const activeWeekdays = useSelector((state: StateType) => {
    // 2023-04-12 Make sure no comma (,) is at the beginning of the string
    if(state.filter && state.filter.weekdays && state.filter.weekdays[0] === ',') {
      return 'mo,tu,we,th,fr,sa,su';
    }
    // Return
    return (state.filter && state.filter.weekdays) ? state.filter.weekdays : '';
  });

  const weekdays = [
    'mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'
  ];
  const weekdayTitles = [
    'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'
  ];

  const toggleWeekday = (weekday) => e => {
    // Get active weekdays as array
    const activeWeekdaysArray = activeWeekdays.split(',');
    let newActiveWeekdaysArray = activeWeekdaysArray;
    // If day was not in array: Add it
    if(activeWeekdaysArray.indexOf(weekday) <= -1) {
      newActiveWeekdaysArray.push(weekday);
    }
    // If day was already in array: Remove it
    else {
      newActiveWeekdaysArray = newActiveWeekdaysArray.filter(x => x !== weekday);
    }
    // Make sure no empty array is possible. If empty: Then all
    if(newActiveWeekdaysArray.length <= 0) {
      newActiveWeekdaysArray = weekdays;
    }

    dispatch({ type: 'SET_FILTER_WEEKDAYS', payload: newActiveWeekdaysArray.join(',') })
  }

  const isWeekdayActive = (weekday) => {
    return activeWeekdays.indexOf(weekday) > -1;
  }

  return (
    <div>

      {weekdays.map((x, idx) => {
        return <Button
          key={idx}
          theme={isWeekdayActive(x) ? 'blue' : 'white'}
          onClick={toggleWeekday(x)}
          classes="mt-1 mr-1 mb-1 ml-1"
        >
          {weekdayTitles[idx].toLowerCase()}
        </Button>
      })}


    </div>
  );
}

const Timeframes = () => {
  const dispatch = useDispatch();

  const activeTimeframes = useSelector((state: StateType) => {
    // 2023-04-12 Make sure no comma (,) is at the beginning of the string
    if(state.filter && state.filter.timeframes && state.filter.timeframes[0] === ',') {
      return '2-6,6-10,10-14,14-18,18-22,22-2';
    }
    // Return
    return (state.filter && state.filter.timeframes) ? state.filter.timeframes : '';
  });

  const timeframes = [
    '2-6', '6-10', '10-14', '14-18', '18-22', '22-2'
  ];

  const toggleTimeframe = (timeframe) => e => {
    // Get active timeframes as array
    const activeTimeframesArray = activeTimeframes.split(',');
    let newActiveTimeframeArray = activeTimeframesArray;
    // If day was not in array: Add it
    if(activeTimeframesArray.indexOf(timeframe) <= -1) {
      newActiveTimeframeArray.push(timeframe);
    }
    // If day was already in array: Remove it
    else {
      newActiveTimeframeArray = newActiveTimeframeArray.filter(x => x !== timeframe);
    }
    // Make sure no empty array is possible. If empty: Then all
    if(newActiveTimeframeArray.length <= 0) {
      newActiveTimeframeArray = timeframes;
    }

    dispatch({ type: 'SET_FILTER_TIMEFRAMES', payload: newActiveTimeframeArray.join(',') })
  }

  const isTimeframeActive = (timeframe) => {
    return activeTimeframes.indexOf(timeframe) > -1;
  }

  return (
    <div>
      {timeframes.map((x, idx) => {
        return <Button
          key={idx}
          theme={isTimeframeActive(x) ? 'blue' : 'white'}
          onClick={toggleTimeframe(x)}
          classes="mt-1 mr-1 mb-1 ml-1"
        >
          {x}
        </Button>
      })}
    </div>
  )
}

function FilterbarHb({
  displayMode,
  visible,
  hideLogo
}) {

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const filter = useSelector((state: StateType) => {
    return state.filter;
  });

  const filterDatum = useSelector((state: StateType) => {
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

      <Fieldset title="Voertuigtype">
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
