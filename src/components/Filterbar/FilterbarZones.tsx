import './css/FilterbarZones.css';
import {useEffect, useState, useRef} from 'react';
import {useSelector} from 'react-redux';
// import { motion } from "framer-motion";
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
  addZonesToMap,
  initMapDrawLogic,
  getAdminZones,
  getZoneById
} from '../Map/MapUtils/zones.js';

// Import API functions
import {postZone, putZone} from '../../api/zones';

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
  const [adminZones, setAdminZones] = useState(null);
  const [activeZone, setActiveZone] = useState({
    // "zone_id": null,
    "area": {},
    "name": '',
    "municipality": null,
    // "geography_id": null,
    "description": null,
    "geography_type": "monitoring",
    // "effective_date": null,
    // "published_date": null,
    // "retire_data": null,
    // "stop": null,
    // "no_parking": null,
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
      if(! e.features || ! e.features[0]) return;
      console.log('setDrawedArea');
      setDrawedArea(e.features[0]);
    });

    setDidInitEventHandlers(true);
  }, [window.ddMap])

  // Get admin zones on component load
  useEffect(x => {

    (async () => {
      const filter = {municipality: filterGebied}
      const zonesFromDb = await getAdminZones(token, filter);
      setAdminZones(zonesFromDb);
    })();

  }, [])

  // Listen to zone selection events (for editing zones)
  useEffect(() => {
    if(! adminZones) return;

    const eventHandler = (e) => {
      const zoneId = e.detail;
      const foundZone = getZoneById(adminZones, zoneId);
      if(foundZone) {
        console.log('foundZone', foundZone)
        // Set zone
        let zoneToSet = {}
        zoneToSet.zone_id = foundZone.zone_id;
        zoneToSet.area = foundZone.area;
        zoneToSet.name = foundZone.name;
        zoneToSet.municipality = foundZone.municipality;
        zoneToSet.geography_type = foundZone.geography_type;
        zoneToSet.geography_id = foundZone.geography_id;
        zoneToSet.description = foundZone.description;
        zoneToSet.published = foundZone.published;
        setActiveZone(zoneToSet);
        // Enable edit mode
        setViewMode('edit');
      }
    }
    window.addEventListener('setSelectedZone', eventHandler);
  }, [adminZones]);

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
    // If existing: update/put zone
    if(activeZone.geography_id) {
      putZone(token, Object.assign({}, activeZone, {
        area: drawedArea || activeZone.area
      }))
    }
    // If new: post zone
    else {
      postZone(token, Object.assign({}, activeZone, {
        municipality: filterGebied,
        area: drawedArea,
        description: 'Zone',
        // effective_date: moment().toISOString(),
        // published_date: moment().toISOString()
      }))
    }

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
            {adminZones ? R.map(renderZoneTag, adminZones) : <div />}
          </div>
        </div>
        <div className="mt-6">
          <div className={labelClassNames}>
            Nieuwe zone
          </div>
          <div>
            {viewMode === 'view' && <Button
              theme="white"
              onClick={enableDrawingPolygons}
            >Nieuwe hub aanmaken</Button>}
            {viewMode === 'edit' && <Button
              theme="white"
              onClick={disableDrawingPolygons}
            >Annuleer nieuwe hub aanmaken</Button>}
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
              defaultValue={activeZone.name}
              onChange={changeHandler}
              classes="w-full"
            />
          </div>
          <div className="mt-2">
            <div className="flex">
              {R.map(x => {
                return <div className={`
                  ${activeZone.geography_type === x.name ? 'Button-orange' : ''}
                  ${x.name === 'monitoring' ? 'cursor-pointer' : 'disabled'}
                  flex-1
                  border-solid
                  border
                  rounded-xl
                  text-gray-500
                  text-center
                  border-gray-500
                  h-10
                  flex
                  flex-col
                  justify-center
                `}
                key={x.name}
                onClick={(e) => {
                   e.preventDefault();
                   if(x.name !== 'monitoring') return;

                   changeHandler({
                    target: {
                      name: 'geography_type',
                      value: x.name
                    }
                  })
                }}>
                  {x.title}
                </div>
              }, [
                {name: 'monitoring', title: 'Analyse'},
                {name: 'parking', title: 'Parking'},
                {name: 'no-parking', title: 'No parking'}
              ])}
            </div>
          </div>

          <div className="mt-2">
            <p>Zone beschikbaarheid:</p>
            <select
              name="zone-availability"
              defaultValue={activeZone.zone_availability}
              onChange={changeHandler}
              >
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
