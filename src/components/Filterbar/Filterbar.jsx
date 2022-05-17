import './css/Filterbar.css';
import {useSelector} from 'react-redux';
import moment from 'moment';
import * as R from 'ramda';
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
import Tag from '../Tag/Tag';
import Button from '../Button/Button';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

const renderZoneTag = ({title, type}) => {
  const backgroundColors = {
    'parking': '#FD862E',
    'no-parking': '#FD3E48',
    'analysis': '#15AEEF'
  }
  return <Tag
    key={title}
    title={title}
    backgroundColor={backgroundColors[type] || '#000'}
  >
    {title}
  </Tag>
}

function FilterbarZones({
  hideLogo
}) {
  const labelClassNames = 'mb-2 text-sm';

  return (
    <div className="filter-bar-inner py-2">
      
      {! hideLogo && <Logo />}
      
      <div className="mt-6">
        <FilteritemGebieden />
      </div>

      <div className="">
        <div className={labelClassNames}>
          Zones
        </div>
        <div>
          {R.map(renderZoneTag, [
            {title: 'Strand hub 1', type: 'parking'},
            {title: 'Strand hub 2', type: 'parking'},
            {title: 'De pier', type: 'no-parking'},
            {title: 'Scheveningseweg', type: 'analysis'},
          ])}
        </div>
      </div>

      <div className="mt-6">
        <div className={labelClassNames}>
          Nieuwe zone
        </div>
        <div>
          <Button
            theme="white"
          >Nieuwe hub aanmaken</Button>
          <Button
            theme="white"
          >Bekijk publieke weergave</Button>
        </div>
      </div>

    </div>
  )
}

function Filterbar({
  displayMode,
  visible,
  hideLogo
}) {

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  const filterDatum = useSelector(state => {
    return state.filter && state.filter.datum ? state.filter.datum : new Date().toISOString();
  });

  const ispark=displayMode===DISPLAYMODE_PARK;
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const iszones=displayMode===DISPLAYMODE_ZONES;
  const isontwikkeling=displayMode===DISPLAYMODE_OTHER;
  
  const showdatum=isrentals||ispark||!isLoggedIn;
  const showduur=isrentals;
  const showparkeerduur=ispark;
  const showafstand=isrentals;
  const showherkomstbestemming=isrentals;
  const showvantot=isontwikkeling;
  const showvervoerstype=isrentals||ispark||!isLoggedIn;

  if(iszones) {
    return <FilterbarZones
      hideLogo={hideLogo}
    />
  }

  else {
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

        {<FilteritemZones />}

        {isLoggedIn && showparkeerduur && <FilteritemMarkersParkeerduur />}

        {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

        {isLoggedIn && showherkomstbestemming && <FilteritemHerkomstBestemming />}

        {showvervoerstype && <FilteritemVoertuigTypes />}

        {<FilteritemAanbieders />}

      </div>
    )
  }
}

export default Filterbar;
