import './css/FilterbarZones.css';
import React, {
  useEffect,
  useState,
  // useRef
} from 'react';
import {useLocation} from "react-router-dom";
import md5 from 'md5';
import {useSelector} from 'react-redux';
// import { motion } from "framer-motion";
// import moment from 'moment';
import st from 'geojson-bounds';
import { Link } from "react-router-dom";
import * as R from 'ramda';
import center from '@turf/center'
import FilteritemGebieden from './FilteritemGebieden.jsx';
// import FilteritemVoertuigTypes from './FilteritemVoertuigTypes.jsx';
import Logo from '../Logo.jsx';
import {renderZoneTag} from '../Tag/Tag';
import Button from '../Button/Button';
import Text from '../Text/Text';
import FormInput from '../FormInput/FormInput';

import {
  setPublicZoneUrl,
  setAdminZoneUrl,
  getAdminZones,
  getPublicZones,
  getZoneById,
  sortZonesInPreferedOrder,
  getLocalDrawsOnly,
  getDraftFeatureId,
  fetchAdminZones,
  fetchPublicZones
} from '../Map/MapUtils/zones.js';

// Import API functions
import {
  postZone,
  putZone,
  deleteZone
} from '../../api/zones';

function ModalityRow({
  children,
  imageUrl,
  onChange,
  name,
  value
}) {
  return <div className="
    bg-no-repeat
    pl-12
    h-8
    flex
    w-full
  " style={{
    backgroundImage: `url('${imageUrl}')`,
    backgroundSize: '30px',
    backgroundPosition: 'center left'
  }}>
    <input
      name={name}
      className="flex-1"
      width="100%"
      type="range"
      min="0"
      max="250"
      step="1"
      onChange={onChange}
      value={value}
      style={{width: "calc(100% - 48px)"}}
    />
    <div className="text-xs ml-2 h-8 flex justify-center flex-col">
      {value ? value : ''}
    </div>
    {children}
  </div>
}

function FilterbarZones({
  hideLogo,
  view
}) {
  const zoneTemplate = {
    // "zone_id": null,
    // "area": {},
    // "name": '',
    // "municipality": null,
    // "geography_id": null,
    // "description": null,
    // "geography_type": "monitoring",
    // "zone_availability": "auto",
    // "effective_date": null,
    // "published_date": null,
    // "retire_data": null,
    // "stop": null,
    // "no_parking": null,
    // "published": true
  }

  const [viewMode, setViewMode] = useState(view || 'adminView');// Possible modes: readonly|adminView|adminEdit
  const [didInitEventHandlers, setDidInitEventHandlers] = useState(false);
  const [counter, setCounter] = useState(0);
  const [drawedArea, setDrawedArea] = useState(null);
  const [adminZones, setAdminZones] = useState(null);
  const [activeZone, setActiveZone] = useState(zoneTemplate);
  const [didChangeZoneConfig, setDidChangeZoneConfig] = useState(false);
  const [limitType, setLimitType] = useState('modality');
  const [pathName, setPathName] = useState(document.location.pathname);

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

  // Store window location in a local variable
  let location = useLocation();
  // ?const isThereMonkeyBusiness = window?.history?.pushState.name === ''
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);

  // If viewMode prop changed: update state
  useEffect(() => {
    setViewMode(view);
  }, [view]);

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

    window.ddMap.on('draw.update', function (e) {
      if(! e.features || ! e.features[0]) return;
      setDrawedArea(e.features[0]);
    });

    setDidInitEventHandlers(true);
  }, [window.ddMap])

  const getAdminZones = async () => {
    const sortedZones = await fetchAdminZones(token, filterGebied);
    setAdminZones(sortedZones);
  }

  const getPublicZones = async () => {
    const sortedZones = await fetchPublicZones(filterGebied);
    setAdminZones(sortedZones);
  }

  // Get admin zones on component load
  useEffect(() => {
    //
    let TO_local = setTimeout(async () => {
      getPublicZones();
    }, 5);
    // Set an interval: refresh data every 60s
    let TO_local_interval = setInterval(async () => {
      getPublicZones();
    }, 60*1000);
    // Cleanup
    return () => {
      clearTimeout(TO_local);
      clearInterval(TO_local_interval);
    }
  }, [
    filterGebied
  ])

  const autoSaveZone = async () => {
    return await saveZone();
  }

  // Listen to zone selection events (for editing zones)
  useEffect(() => {
    if(! adminZones) return;

    const eventHandler = async (e) => {
      const zoneId = e.detail;
      if(
        zoneId === activeZone.zone_id// Currently edited zone
        || typeof zoneId === 'string'// New zone
      ) {
        // Do nothing
        return;
      }

      if(didChangeZoneConfig) {
        // Ask for confirmation
        if(window.confirm('Je hebt onopgeslagen wijzigingen. Wil je doorgaan zonder op te slaan?')) {
          // Check if there's a draft polygon: if so -> remove
          const draftFeatureId = getDraftFeatureId();
          if(draftFeatureId) {
            window.CROW_DD.theDraw.delete(draftFeatureId);
          }
        }
        // If user clicks cancel button: do nothing
        else {
          e.preventDefault();
          return;
        }
      }

      // Set didChangeZoneConfig to false
      setDidChangeZoneConfig(false);

      // Don't do anything if zone was selected already
      if(zoneId === activeZone.zone_id && window.CROW_DD.theDraw.getMode() === 'direct_select') {
        // console.log('Do nothing')
        return;
      }

      // Select feature on the map
      if(window.ddMap && zoneId) {
        const feature = window.CROW_DD.theDraw.get(zoneId);
        if(feature) {
          // Select
          window.CROW_DD.theDraw.changeMode('direct_select', {
            featureId: zoneId
          });
        }
      }

      const foundZone = getZoneById(adminZones, zoneId);

      if(foundZone) {
        // Change URL
        setAdminZoneUrl(foundZone.geography_id)
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
        if(foundZone.stop) {
          zoneToSet.stop = foundZone.stop;
          zoneToSet['vehicles-limit.bicycle'] = foundZone.stop.capacity.bicycle || 0;
          zoneToSet['vehicles-limit.moped'] = foundZone.stop.capacity.moped || 0;
          zoneToSet['vehicles-limit.scooter'] = foundZone.stop.capacity.scooter || 0;
          zoneToSet['vehicles-limit.cargo_bicycle'] = foundZone.stop.capacity.cargo_bicycle || 0;
          zoneToSet['vehicles-limit.car'] = foundZone.stop.capacity.car || 0;
          zoneToSet['vehicles-limit.other'] = foundZone.stop.capacity.other || 0;
          zoneToSet['vehicles-limit.combined'] = foundZone.stop.capacity.combined || 0;
          // Set zone availability
          if(foundZone.stop.status.control_automatic === true) {
            zoneToSet.zone_availability = 'auto';
          } else if(! foundZone.stop.status.control_automatic && foundZone.stop.status.is_returning === true) {
            zoneToSet.zone_availability = 'open';
          } else if(! foundZone.stop.status.control_automatic && foundZone.stop.status.is_returning === false) {
            zoneToSet.zone_availability = 'closed';
          }
          // Set limit type
          if(zoneToSet['vehicles-limit.combined'] && zoneToSet['vehicles-limit.combined'] > 0) {
            setLimitType('combined');
          } else {
            setLimitType('modality');
          }
        }
        setActiveZone(zoneToSet);
        // Enable edit mode
        setViewMode('adminEdit');
      }
      return true;
    }
    window.addEventListener('setSelectedZone', eventHandler);
    return () => {
      window.removeEventListener('setSelectedZone', eventHandler);
    }
  }, [
    adminZones,
    activeZone.zone_id,
    didChangeZoneConfig
  ]);

  const enableDrawingPolygons = () => {
    // Check if the map is initiated and draw is available
    if(! window.CROW_DD.theDraw) return;
    // Change mode to 'draw polygon'
    window.CROW_DD.theDraw.changeMode('draw_polygon');
    // Clear data
    setActiveZone(zoneTemplate);
    // Set view mode to 'adminEdit'
    setViewMode('adminEdit');
  }

  const disableDrawingPolygons = () => {
    // Check if the map is initiated and draw is available
    if(! window.CROW_DD.theDraw) return;
    // Change mode to 'draw polygon'
    // window.CROW_DD.theDraw.changeMode('static', []);
    window.CROW_DD.theDraw.changeMode('simple_select', []);
    // Set view mode to 'adminView'
    setViewMode('adminView');
  }

  const changeHandler = (e) => {
    if(! e.target) return;
    if(! e.target.name) return;

    // Set didChangeZoneConfig to true
    setDidChangeZoneConfig(true);

    // Update active zone data
    let updatedZoneData = activeZone;
    updatedZoneData[e.target.name] = e.target.value;
    setActiveZone(updatedZoneData);
    setCounter(counter+1);// Because above var is referenced and doesn't trigger a re-render
  }

  const getRequestData = () => {
    // If zone has been updated:
    if(activeZone.geography_id) {
      return {
        geography_id: activeZone.geography_id,
        geography_type: activeZone.geography_type,
        municipality: activeZone.municipality,
        name: activeZone.name,
        description: activeZone.description,
        published: activeZone.published,
        zone_availability: activeZone.zone_availability,
        zone_id: activeZone.zone_id,
        area: drawedArea || activeZone.area
      }
    }
    // If zone is newly created:
    else {
      return Object.assign({
        geography_id: activeZone.geography_id,
        geography_type: activeZone.geography_type,
        name: activeZone.name,
        published: activeZone.published,
        zone_availability: activeZone.zone_availability
      }, {
        municipality: filterGebied,
        area: drawedArea,
        description: 'Zone'
      })
    }
  }

  const getRequestDataForMonitoring = () => {
    return getRequestData();
  }
  const getRequestDataForStop = () => {
    let data = getRequestData();
    data.geography_type = 'stop';
    data.stop = generateStopObject();
    return data;
  }
  const getRequestDataForNoParking = () => {
    let data = getRequestData();
    data.no_parking = activeZone.no_parking || {}
    return data;
  }

  // Generates the data object for 'stops'
  const generateStopObject = () => {
    const getCapacity = () => {
      if(limitType === 'combined') {
        if(! activeZone['vehicles-limit.combined'] || activeZone['vehicles-limit.combined'] <= 0) {
          return {}
        }
        return {
          "combined": parseInt(activeZone['vehicles-limit.combined'])
        }
      }
      let capacity = {};
      if(parseInt(activeZone['vehicles-limit.cargo_bicycle']) > 0) capacity.cargo_bicycle = parseInt(activeZone['vehicles-limit.cargo_bicycle']);
      if(parseInt(activeZone['vehicles-limit.scooter']) > 0) capacity.scooter = parseInt(activeZone['vehicles-limit.scooter']);
      if(parseInt(activeZone['vehicles-limit.bicycle']) > 0) capacity.bicycle = parseInt(activeZone['vehicles-limit.bicycle']);
      if(parseInt(activeZone['vehicles-limit.car']) > 0) capacity.car = parseInt(activeZone['vehicles-limit.car']);
      if(parseInt(activeZone['vehicles-limit.other']) > 0) capacity.other = parseInt(activeZone['vehicles-limit.other']);
      if(parseInt(activeZone['vehicles-limit.moped']) > 0) capacity.moped = parseInt(activeZone['vehicles-limit.moped']);
      return capacity;
    }
    const getStatus = () => {
      return {
        "control_automatic": activeZone && activeZone.zone_availability === 'auto',
        "is_returning": activeZone && (activeZone.zone_availability === 'auto' || activeZone.zone_availability === 'open'),
        "is_installed": activeZone && activeZone.stop && activeZone.stop.status ? activeZone.stop.status.is_installed : false,
        "is_renting": activeZone && activeZone.stop && activeZone.stop.status ? activeZone.stop.status.is_renting : false,
      }
    }
    if(activeZone && activeZone.stop && activeZone.stop_id) {
      return {
        stop_id: activeZone.stop.stop_id,
        location: activeZone.stop.location,
        status: getStatus(),
        capacity: getCapacity()
      }
    }
    return {
      location: activeZone.area ? center(activeZone.area) : center(drawedArea),
      status: getStatus(),
      capacity: getCapacity()
    }
  }

  const saveZone = async () => {
    if(! activeZone.area && ! drawedArea) {
      notify('Teken eerst een zone voordat je deze opslaat')
      return;
    }

    // Save zone
    let requestData = getRequestDataForMonitoring();
    if(activeZone.geography_type === 'stop') requestData = getRequestDataForStop();
    else if(activeZone.geography_type === 'no_parking') requestData = getRequestDataForNoParking();

    // If existing: update/put zone
    if(activeZone.geography_id) {
      const updatedZone = await putZone(token, requestData);
      // Error handling
      if(! updatedZone.zone_id) {
        console.error(updatedZone);
        alert('Er ging iets fout bij het opslaan van de zone.')
        return;
      }
      // Set updated zone in states
      setActiveZone(updatedZone);
      // Remove old drawed area
      window.CROW_DD.theDraw.delete(activeZone.zone_id);
      // Add new drawed area
      var feature = {
        id: updatedZone.zone_id,
        type: 'Feature',
        properties: {
          geography_type: updatedZone.geography_type
        },
        geometry: { type: 'Polygon', coordinates: updatedZone.area.geometry.coordinates }
      };
      var featureIds = window.CROW_DD.theDraw.add(feature);
      // After updating zone: reload adminZones
      getAdminZones();
    }
    // If new: post zone
    else {
      const createdZone = await postZone(token, requestData)
      // After creating new zone: reload adminZones
      getAdminZones();
      // After creating new zone: set polygon data
      if(! createdZone || ! createdZone.area) return;
      const feature = {
        id: createdZone.zone_id,
        type: 'Feature',
        properties: {
          geography_type: createdZone.geography_type
        },
        geometry: { type: 'Polygon', coordinates: createdZone.area.geometry.coordinates }
      };
      const featureIds = window.CROW_DD.theDraw.add(feature);
    }

    // Set map to normal again
    disableDrawingPolygons();

    // Reset 'activeZone'
    setActiveZone(zoneTemplate);   

    // Delete all local zones from map
    deleteAllLocalZones();

    setDidChangeZoneConfig(false);

    return true;
  }

  const newZoneButtonHandler = () => {
    enableDrawingPolygons();
  }

  const deleteZoneHandler = async () => {

    if(! window.confirm('Weet je zeker dat je deze zone wilt verwijderen?')) return;

    if(! activeZone || ! activeZone.geography_id) return;
    await deleteZone(token, activeZone.geography_id)

    // Reload adminZones
    getAdminZones();

    // Delete polygon from map
    window.CROW_DD.theDraw.delete(activeZone.zone_id);

    // Set map to normal again
    disableDrawingPolygons();
  }
  
  const deleteAllLocalZones = () => {
    const allDraws = window.CROW_DD.theDraw.getAll();
    getLocalDrawsOnly(allDraws.features).map(x => {
      window.CROW_DD.theDraw.delete(x.id);
    })
  }

  const cancelButtonHandler = () => {
    // Only ask for a confirmation if the area was changed
    const isNewZone = ! activeZone.geography_id;
    if(drawedArea && isNewZone) {
      if(! window.confirm('Weet je zeker dat je het tekenen van de zone wilt annuleren?')) {
        return;
      }
    }
    // Cleanup
    // - Revert changes to existing polygons
    window.CROW_DD.theDraw.trash()
    // - Delete local polygons
    deleteAllLocalZones();
    // Disable drawing mode
    disableDrawingPolygons();
    // Reset 'activeZone'
    setActiveZone(zoneTemplate);   
    // Reload adminZones
    getAdminZones();
    //
    setDidChangeZoneConfig(false);
  }

  const isNewZone = ! activeZone.geography_id;

  return (
    <div className="filter-bar-inner py-2">
      
      {! hideLogo && <Logo />}
      
      <div className="mt-6">
        <FilteritemGebieden />
      </div>

      {! filterGebied && false && <div>
        Selecteer een plaats.
      </div>}

      {(viewMode === 'readonly' && token) && <>
        <div className={labelClassNames}>
          &nbsp;
        </div>
        <div className="flex justify-end -mr-2">
          <Link to="/map/zones">
            <Button
              theme="white"
            >
              📊
            </Button>
          </Link>
          
          <Link to="/admin/zones">
            <Button
              theme="white"
            >
              ✏️
            </Button>
          </Link>
        </div>
      </>}

      {viewMode === 'adminView' && <div>
        <div className={labelClassNames}>
          Nieuwe zone
        </div>
        <div>
          {viewMode === 'adminView' && <div className="flex justify-between">
            <Button
              theme="white"
              onClick={newZoneButtonHandler}
            >
              Nieuwe zone aanmaken
            </Button>
            
            <div className="flex -mr-2">
              <Link to="/map/zones">
                <Button
                  theme="white"
                >
                  📊
                </Button>
              </Link>
              
              <Link to="/admin/zones">
                <Button
                  theme="white"
                >
                  ✏️
                </Button>
              </Link>
            </div>

          </div>}
          {viewMode === 'adminEdit' && <Button
            theme="white"
            onClick={cancelButtonHandler}
          >
            Annuleer
          </Button>}
        </div>
      </div>}

      {(viewMode === 'adminEdit') && <div>
        <div className={labelClassNames}>
          Zone {isNewZone ? 'toevoegen' : 'wijzigen'}
        </div>
        <div className="flex justify-between">
          <Button
            theme={didChangeZoneConfig ? `greenHighlighted` : `green`}
            onClick={saveZone}
          >
            Opslaan
          </Button>

          <div className="-mr-2">
            {! isNewZone && <Button
              onClick={deleteZoneHandler}
            >
              🗑️
            </Button>}

            <Button
              theme="white"
              onClick={cancelButtonHandler}
            >
              Annuleer
            </Button>
          </div>
        </div>
        <div>
          <FormInput
            type="text"
            placeholder="Naam van de zone"
            name="name"
            autoComplete="off"
            id="js-FilterbarZones-name-input"
            value={activeZone.name || ""}
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
              style={{
                backgroundColor: `${activeZone.geography_type === x.name ? x.color : ''}`
              }}
              key={x.name}
              onClick={(e) => {
                 e.preventDefault();

                 // Save state
                 changeHandler({
                  target: {
                    name: 'geography_type',
                    value: x.name
                  }
                })

                // Update map feature props (geography_type)
                let zoneId = activeZone.zone_id;
                // If not in edit mode: check if there's 1 newly created polygon
                if(! zoneId) {
                  zoneId = getDraftFeatureId();
                }

                if(zoneId) {
                  // Force rerender of Draw, so that polygon color updates
                  const forceMapRerenderForFeature = (featureId) => {
                    window.CROW_DD.theDraw.changeMode('simple_select', []);
                    // NOTE: This had a side effect which is re-calling eventHandler()
                    // NOTE: The side effect is that if creating new zone: name is discarted
                    window.CROW_DD.theDraw.changeMode('direct_select', {
                      featureId: featureId
                    });
                  }
                  forceMapRerenderForFeature(zoneId);
                }

              }}>
                {x.title}
              </div>
            }, [
              {name: 'monitoring', title: 'Analyse', color: '#15aeef'},
              {name: 'stop', title: 'Parking', color: '#fd862e'},
              {name: 'no_parking', title: 'No parking', color: '#fd3e48'}
            ])}
          </div>
        </div>

        <div className={`
          py-2
          ${activeZone.geography_type === 'stop' ? 'visible' : 'invisible'}
        `}>
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

        <div className={activeZone.geography_type === 'stop' ? 'visible' : 'invisible'}>
          <p className="mb-2 text-sm">
            Limiet <a onClick={() => setLimitType('modality')} className={`
              ${limitType === 'modality' ? 'underline' : ''}
              cursor-pointer
            `}>
              per modaliteit
            </a> | <a onClick={() => setLimitType('combined')} className={`
              ${limitType === 'combined' ? 'underline' : ''}
              cursor-pointer
            `}>
              totaal
            </a>
          </p>

          <div className="
            rounded-lg
            bg-white
            border-solid
            border
            border-gray-400
            p-4
          ">
            {limitType === 'combined' && <ModalityRow
              imageUrl=""
              name="vehicles-limit.combined"
              value={activeZone['vehicles-limit.combined']}
              onChange={changeHandler}
            />}
            {limitType === 'modality' && <>
              <ModalityRow
                imageUrl="https://i.imgur.com/IF05O8u.png"
                name="vehicles-limit.bicycle"
                value={activeZone['vehicles-limit.bicycle']}
                onChange={changeHandler}
              />
              <ModalityRow
                imageUrl="https://i.imgur.com/FdVBJaZ.png"
                name="vehicles-limit.cargo_bicycle"
                value={activeZone['vehicles-limit.cargo_bicycle']}
                onChange={changeHandler}
              />
              <ModalityRow
                imageUrl="https://i.imgur.com/h264sb2.png"
                name="vehicles-limit.moped"
                value={activeZone['vehicles-limit.moped']}
                onChange={changeHandler}
              />
              <ModalityRow
                imageUrl="https://i.imgur.com/7Y2PYpv.png"
                name="vehicles-limit.car"
                value={activeZone['vehicles-limit.car']}
                onChange={changeHandler}
              />
            </>}
          </div>
        </div>

      </div>}

      {(false && ! isNewZone && viewMode === 'adminEdit') && <div className="my-2 text-center">
        <Text
          theme="red"
          onClick={deleteZoneHandler}
          classes="text-xs"
        >
          Verwijder zone
        </Text>
      </div>}

      <div className="mt-6">
        <div className={labelClassNames}>
          Zones
        </div>
        <div>
          {adminZones ? R.map((x) => {
            // Add onClick handler
            const zoneId = x.zone_id;
            if(viewMode === 'adminView') {
              x.onClick = () => {
                // Trigger setSelectedZone custom event (see FilterbarZones.tsx)
                const event = new CustomEvent('setSelectedZone', {
                  detail: zoneId
                });
                window.dispatchEvent(event);
                // Zoom in into zone
                if(x.area && x.area.geometry && x.area.geometry.coordinates && x.area.geometry.coordinates[0]) {
                  if(! window.ddMap) return;
                  // Get extent
                  const extent = st.extent(x.area)
                  window.ddMap.fitBounds(extent, {
                    padding: {top: 25, bottom: 25, left: 350, right: 25},
                    duration: 1.4*1000 // in ms
                  });
                }
                // Change URL
                setAdminZoneUrl(x.geography_id)
              };
            }
            if(viewMode === 'readonly') {
              x.onClick = () => {
                // Zoom in into zone
                if(x.area && x.area.geometry && x.area.geometry.coordinates && x.area.geometry.coordinates[0]) {
                  if(! window.ddMap) return;
                  // Get extent
                  const extent = st.extent(x.area)
                  window.ddMap.fitBounds(extent, {
                    padding: {top: 25, bottom: 25, left: 350, right: 25},
                    duration: 1.4*1000 // in ms
                  });
                }
                // Change URL
                setPublicZoneUrl(x.geography_id)
              };
            }
            return renderZoneTag(x, x.zone_id === activeZone.zone_id, viewMode);
          }, adminZones) : <div />}
        </div>
      </div>

    </div>
  )
}

export default FilterbarZones;
