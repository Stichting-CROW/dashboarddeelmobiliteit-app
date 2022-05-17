import './css/Filterbar.css';
import {useState, useRef} from 'react';
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
import {renderZoneTag} from '../Tag/Tag';
import Button from '../Button/Button';
import FormInput from '../FormInput/FormInput';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

function FilterbarZones({
  hideLogo
}) {
  const [viewMode, setViewMode] = useState('view');// Possible modes: view|edit
  const [activeZone, setActiveZone] = useState({});

  const labelClassNames = 'mb-2 text-sm';

  const enableDrawingPolygons = () => {
    // Check if the map is initiated and draw is available
    if(! window.CROW_DD.theDraw) return;
    // Change mode to 'draw polygon'
    window.CROW_DD.theDraw.changeMode('draw_polygon');
    // Set view mode to 'edit'
    setViewMode('edit');
  }

  const disableDrawingPolygons = () => {
    // Check if the map is initiated and draw is available
    if(! window.CROW_DD.theDraw) return;
    // Change mode to 'draw polygon'
    window.CROW_DD.theDraw.changeMode('static', []);
    // window.CROW_DD.theDraw.changeMode('simple_select', []);
    // Set view mode to 'edit'
    setViewMode('view');
  }

  const changeHandler = (e) => {
    if(! e.target) return;
    if(! e.target.name) return;
    if(! e.target.value) return;
    // Update active zone data
    let updatedZoneData = activeZone;
    updatedZoneData[e.target.name] = e.target.value;
    setActiveZone(updatedZoneData);
  }

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
            onClick={enableDrawingPolygons}
          >Nieuwe hub aanmaken</Button>
          {/*<Button
            theme="white"
          >Bekijk publieke weergave</Button>*/}
        </div>
      </div>

      {(viewMode === 'edit') && <div className="mt-6">
        <div className={labelClassNames}>
          Hub wijzigen
        </div>
        <div>
          <Button
            theme="white"
            onClick={disableDrawingPolygons}
          >
            Opslaan
          </Button>
        </div>
        <div>
          <FormInput
            type="text"
            name="title"
            defaultValue=""
            onChange={changeHandler}
            classes="w-full"
          />
        </div>
        <div>
          <p>Type zone:</p>
          <select name="zone-type" onChange={changeHandler}>
            <option value="analysis">
              Analyse
            </option>
            <option value="parking">
              Parking
            </option>
            <option value="no-parking">
              No parking
            </option>
          </select>
        </div>

        <div>
          <p>Zone beschikbaarheid:</p>
          <select name="zone-availability" onChange={changeHandler}>
            <option value="analysis">
              Automatisch
            </option>
            <option value="parking">
              Open
            </option>
            <option value="no-parking">
              Geslopen
            </option>
          </select>
        </div>

        <div>
          <p>Limiet per modaliteit:</p>
          Fiets: <FormInput
            type="number"
            min="0"
            name="vehicles-limit.bikes"
            defaultValue=""
            onChange={changeHandler}
          />
          Bakfiets: <FormInput
            type="number"
            min="0"
            name="vehicles-limit.cargo"
            defaultValue=""
            onChange={changeHandler}
          />
          Scooter: <FormInput
            type="number"
            min="0"
            name="vehicles-limit.moped"
            defaultValue=""
            onChange={changeHandler}
          />
          Auto: <FormInput
            disabled={true}
            type="number"
            min="0"
            name="vehicles-limit.moped"
            defaultValue=""
            onChange={changeHandler}
          />
        </div>
      </div>}

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
