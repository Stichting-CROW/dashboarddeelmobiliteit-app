import './css/Filterbar.css';
import {useEffect, useState, useRef} from 'react';
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

// Import API functions
import {postZone} from '../../api/zones';

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
  const [didInitEventHandlers, setDidInitEventHandlers] = useState(false);
  const [drawedArea, setDrawedArea] = useState(null);
  const [activeZone, setActiveZone] = useState({
    "zone_id": null,
    "area": {},
    "name": '',
    "municipality": null,
    "geography_id": null,
    "description": null,
    "geography_type": "monitoring",
    "effective_date": null,
    "published_date": null,
    "retire_data": null,
    "stop": null,
    "no_parking": null,
    "published": true
  });

  const labelClassNames = 'mb-2 text-sm';

  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : null;
  });

  const token = useSelector(state => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // Set map event handlers
  useEffect(() => {
    if(! window.ddMap) {
      return;
    }
    if(didInitEventHandlers) {
      return;
    }

    window.ddMap.on('draw.create', function (e) {
      console.log(e.features);
      if(! e.features || ! e.features[0]) return;
      setDrawedArea(e.features[0]);
    });

    setDidInitEventHandlers(true);
  }, [window.ddMap])

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

  const saveZone = () => {
    // Save zone
    postZone(token, Object.assign({}, activeZone, {
      municipality: filterGebied,
      area: drawedArea,
      description: 'Zone',
      effective_date: moment().toISOString(),
      published_date: moment().toISOString()
    }))
    console.log(Object.assign({}, activeZone, {
      municipality: filterGebied,
      area: drawedArea,
      description: 'Zone',
      effective_date: moment().toISOString(),
      published_date: moment().toISOString()
    }));

    // Set map to normal again
    disableDrawingPolygons();
  }

  return (
    <div className="filter-bar-inner py-2">
      
      {! hideLogo && <Logo />}
      
      <div className="mt-6">
        <FilteritemGebieden />
      </div>

      {! filterGebied && <div>
        Selecteer een plaats.
      </div>}

      {filterGebied && <>
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
              onClick={saveZone}
            >
              Opslaan
            </Button>
          </div>
          <div>
            <FormInput
              type="text"
              name="name"
              defaultValue=""
              onChange={changeHandler}
              classes="w-full"
            />
          </div>
          <div>
            <p>Type zone:</p>
            <select name="geography_type" onChange={changeHandler}>
              <option value="monitoring">
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
                Gesloten
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
      </>}

    </div>
  )
}

export default FilterbarZones;
