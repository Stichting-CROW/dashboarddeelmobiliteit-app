import './css/FilterbarZones.css';
import React, {useEffect, useState, useRef} from 'react';
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
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';

import {
  addZonesToMap,
  initMapDrawLogic,
  getAdminZones,
  getZoneById
} from '../Map/MapUtils/zones.js';

// Import API functions
import {
  postZone,
  putZone,
  deleteZone
} from '../../api/zones';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

function ModalityRow({children, imageUrl}) {
  return <div className="
    bg-left-center
    bg-no-repeat
    pl-16
  " style={{
    backgroundImage: `url('${imageUrl}')`,
    backgroundSize: '60px'
  }}>
    {children}
  </div>
}

function FilterbarZones({
  hideLogo
}) {
  const zoneTemplate = {
    // "zone_id": null,
    // "area": {},
    // "name": '',
    // "municipality": null,
    // "geography_id": null,
    // "description": null,
    "geography_type": "monitoring",
    "zone_availability": "auto",
    // "effective_date": null,
    // "published_date": null,
    // "retire_data": null,
    // "stop": null,
    // "no_parking": null,
    "published": true
  }

  const [viewMode, setViewMode] = useState('view');// Possible modes: view|edit
  const [didInitEventHandlers, setDidInitEventHandlers] = useState(false);
  const [counter, setCounter] = useState(0);
  const [drawedArea, setDrawedArea] = useState(null);
  const [adminZones, setAdminZones] = useState(null);
  const [activeZone, setActiveZone] = useState(zoneTemplate);

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
      setDrawedArea(e.features[0]);
    });

    setDidInitEventHandlers(true);
  }, [window.ddMap])

  const fetchAdminZones = async () => {
    const filter = {municipality: filterGebied}
    const zonesFromDb = await getAdminZones(token, filter);
    setAdminZones(zonesFromDb);
  }
  // Get admin zones on component load
  useEffect(() => {
    fetchAdminZones();
  }, [])

  // Listen to zone selection events (for editing zones)
  useEffect(() => {
    if(! adminZones) return;

    const eventHandler = (e) => {
      const zoneId = e.detail;
      // TODO getZoneById after zone creation
      const foundZone = getZoneById(adminZones, zoneId);
      if(foundZone) {
        // Set zone
        let zoneToSet = zoneTemplate;
        zoneToSet.zone_id = foundZone.zone_id;
        zoneToSet.area = foundZone.area;
        zoneToSet.name = foundZone.name;
        zoneToSet.municipality = foundZone.municipality;
        zoneToSet.geography_type = foundZone.geography_type || zoneTemplate.geography_type;
        zoneToSet.geography_id = foundZone.geography_id;
        zoneToSet.description = foundZone.description;
        zoneToSet.published = foundZone.published || zoneTemplate.published;
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
    // Clear data
    setActiveZone(zoneTemplate);
    // Set view mode to 'edit'
    setViewMode('edit');
  }

  const disableDrawingPolygons = () => {
    // Check if the map is initiated and draw is available
    if(! window.CROW_DD.theDraw) return;
    // Change mode to 'draw polygon'
    // window.CROW_DD.theDraw.changeMode('static', []);
    window.CROW_DD.theDraw.changeMode('simple_select', []);
    // Set view mode to 'edit'
    setViewMode('view');
  }

  const changeHandler = (e) => {
    if(! e.target) return;
    if(! e.target.name) return;

    // Update active zone data
    let updatedZoneData = activeZone;
    updatedZoneData[e.target.name] = e.target.value;
    setActiveZone(updatedZoneData);
    setCounter(counter+1);// Because above var is referenced and doesn't trigger a re-render
  }

  const saveZone = async () => {

    if(! activeZone.area && activeZone.drawedArea) {
      notify('Teken eerst een zone voordat je deze opslaat')
      return;
    }

    // Save zone
    // If existing: update/put zone
    if(activeZone.geography_id) {
      const updatedZone = await putZone(token, Object.assign({}, activeZone, {
        area: drawedArea || activeZone.area
      }))
      setActiveZone(updatedZone);
      // After updating zone: reload adminZones
      fetchAdminZones();
    }
    // If new: post zone
    else {
      const createdZone = await postZone(token, Object.assign({}, activeZone, {
        municipality: filterGebied,
        area: drawedArea,
        description: 'Zone'
      }))
      // After creating new zone: reload adminZones
      fetchAdminZones();
      // After creating new zone: set polygon data
      if(! createdZone || ! createdZone.area) return;
      const feature = {
        id: createdZone.zone_id,
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: createdZone.area.geometry.coordinates }
      };
      const featureIds = window.CROW_DD.theDraw.add(feature);
    }

    // Set map to normal again
    disableDrawingPolygons();
  }

  const newZoneButtonHandler = () => {
    enableDrawingPolygons();
  }

  const deleteZoneHandler = async () => {

    if(! window.confirm('Weet je zeker dat je deze zone wilt verwijderen?')) return;

    if(! activeZone || ! activeZone.geography_id) return;
    await deleteZone(token, activeZone.geography_id)

    // Set map to normal again
    disableDrawingPolygons();

    // Reload adminZones
    fetchAdminZones();

    // Delete polygon from map
    window.CROW_DD.theDraw.delete(activeZone.zone_id);
  }
  
  const deleteAllLocalZones = () => {
    const allDraws = window.CROW_DD.theDraw.getAll();
    const getLocalDrawsOnly = (draws) => {
      // If id is a string and not int, it is generated by mapbox-gl-draw
      let localDraws = [];
      draws.map(x => {
        if(x.id && typeof x.id === 'string') {
          localDraws.push(x);
        }
      });
      return localDraws;
    }
    getLocalDrawsOnly(allDraws.features).map(x => {
      window.CROW_DD.theDraw.delete(x.id);
    })
  }

  const cancelButtonHandler = () => {
    console.log('cancelButtonHandler', cancelButtonHandler)
    deleteAllLocalZones();
    disableDrawingPolygons();
  }

  const isNewZone = ! activeZone.geography_id;

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
        
        {viewMode === 'view' && <div className="mt-6">
          <div className={labelClassNames}>
            Nieuwe zone
          </div>
          <div>
            {viewMode === 'view' && <Button
              theme="white"
              onClick={newZoneButtonHandler}
            >
              Nieuwe zone aanmaken
            </Button>}
            {viewMode === 'edit' && <Button
              theme="white"
              onClick={cancelButtonHandler}
            >
              Annuleer
            </Button>}
          </div>
        </div>}

        {(viewMode === 'edit') && <div className="mt-6">
          <div className={labelClassNames}>
            Zone {isNewZone ? 'toevoegen' : 'wijzigen'}
          </div>
          <div className="flex justify-between">
            <Button
              theme="green"
              onClick={saveZone}
            >
              Opslaan
            </Button>

            <Button
              theme="white"
              onClick={cancelButtonHandler}
            >
              Annuleer
            </Button>
          </div>
          <div>
            <FormInput
              type="text"
              placeholder="Naam van de zone"
              name="name"
              autoComplete="false"
              id="js-FilterbarZones-name-input"
              value={activeZone.name}
              onChange={changeHandler}
              classes="w-full"
            />
          </div>

          <div className="
            mt-0
          ">
            <div className="
              flex
              rounded-lg bg-white
              border-solid
              border
              border-gray-400
              text-sm
            ">
              {R.map(x => {
                return <div className={`
                  ${activeZone.geography_type === x.name ? 'Button-orange' : ''}
                  cursor-pointer
                  flex-1
                  
                  rounded-lg
                  text-gray-500
                  text-center
                  h-10
                  flex
                  flex-col
                  justify-center
                `}
                key={x.name}
                onClick={(e) => {
                   e.preventDefault();

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

          <div className="
            py-2
          ">
            <div className="
              flex
              rounded-lg bg-white
              border-solid
              border
              border-gray-400
              text-sm
            ">
              {/*
              Availability zit verstopt in status.
              is_enabled = true is open, is_enabled = false is gesloten
              control_automatic=true
              */}
              {R.map(x => {
                return <div className={`
                  ${activeZone.zone_availability === x.name ? 'Button-blue' : ''}
                  cursor-pointer
                  flex-1
                  rounded-lg
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

                   changeHandler({
                    target: {
                      name: 'zone_availability',
                      value: x.name
                    }
                  })
                }}>
                  {x.title}
                </div>
              }, [
                {name: 'auto', title: 'Automatisch'},
                {name: 'open', title: 'Open'},
                {name: 'closed', title: 'Gesloten'}
              ])}
            </div>
          </div>

          <p className="mb-2 text-sm">
            Limiet per modaliteit:
          </p>

          <div className="
            rounded-lg
            bg-white
            border-solid
            border
            border-gray-400
            p-4
          ">
            <ModalityRow imageUrl="https://i.imgur.com/IF05O8u.png">
              <FormInput
                type="number"
                min="0"
                name="vehicles-limit.bikes"
                defaultValue=""
                onChange={changeHandler}
              />
            </ModalityRow>
            <ModalityRow imageUrl="https://i.imgur.com/FdVBJaZ.png">
              <FormInput
                type="number"
                min="0"
                name="vehicles-limit.cargo"
                defaultValue=""
                onChange={changeHandler}
              />
            </ModalityRow>
            <ModalityRow imageUrl="https://i.imgur.com/h264sb2.png">
              <FormInput
                type="number"
                min="0"
                name="vehicles-limit.moped"
                defaultValue=""
                onChange={changeHandler}
              />
            </ModalityRow>
            <ModalityRow imageUrl="https://i.imgur.com/7Y2PYpv.png">
              <FormInput
                disabled={true}
                type="number"
                min="0"
                name="vehicles-limit.moped"
                defaultValue=""
                onChange={changeHandler}
              />
            </ModalityRow>
          </div>
        </div>}

        {(! isNewZone && viewMode === 'edit') && <div className="my-2 text-center">
          <Text
            theme="red"
            onClick={deleteZoneHandler}
            classes="text-xs"
          >
            Verwijder zone
          </Text>
        </div>}

      </>}

    </div>
  )
}

export default FilterbarZones;
