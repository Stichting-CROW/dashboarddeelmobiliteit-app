import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
import 'moment/min/locales';
import {useLocation} from "react-router-dom";
import SearchBar from '../SearchBar/SearchBar';

import {StateType} from '../../types/StateType';

// MapBox utils
// https://www.npmjs.com/package/mapbox-gl-utils
// https://github.com/mapbox/mapbox-gl-js/issues/1722#issuecomment-460500411
import U from 'mapbox-gl-utils';
import {getMapStyles, applyMapStyle} from './MapUtils/map.js';
import {initPopupLogic} from './MapUtils/popups.js';
import {initClusters} from './MapUtils/clusters.js';
import {
  addLayers,
  activateLayers
} from './MapUtils/layers.js';
import {addSources} from './MapUtils/sources.js';
import {
  navigateToGeography,
  triggerGeographyClick,
  fetchPublicZones,
  fetchAdminZones
} from './MapUtils/zones.js';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
} from '../../reducers/layers.js';

import './MapComponent.css';

import {layers} from './layers';
import {sources} from './sources.js';
import {getVehicleMarkers, getVehicleMarkers_rentals} from './vehicle_marker.js';

import IsochroneTools from '../IsochroneTools/IsochroneTools';
import DdH3HexagonLayer from '../MapLayer/DdH3HexagonLayer';
import DdServiceAreasLayer from '../MapLayer/DdServiceAreasLayer';
import DdPolicyHubsLayer from '../MapLayer/DdPolicyHubsLayer';
import DdParkEventsLayer from '../MapLayer/DdParkEventsLayer';
import DdRentalsLayer from '../MapLayer/DdRentalsLayer';
import { WidthIcon } from '@radix-ui/react-icons';

// Set language for momentJS
moment.updateLocale('nl', moment.locale);

const MapComponent = (props): JSX.Element => {
  const [pathName, setPathName] = useState(document.location.pathname);
  const [uriParams, setUriParams] = useState(document.location.search);

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : null;
  });

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const mapStyle = useSelector((state: StateType) => {
    return state.layers ? state.layers.map_style : null;
  });

  // Connect to redux store
  const dispatch = useDispatch()

  // Get data from store
  const vehicles = useSelector((state: StateType) => state.vehicles || null);
  const filter = useSelector((state: StateType) => state.filter || null);
  const rentals = useSelector((state: StateType) => state.rentals || null);
  const stateLayers = useSelector((state: StateType) => state.layers || null);
  const isLoggedIn = useSelector((state: StateType) => state.authentication.user_data ? true : false);
  const providers = useSelector((state: StateType) => (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : []);
  const extent/* map boundaries */ = useSelector((state: StateType) => state.layers ? state.layers.extent : null);
  const [counter, setCounter] = useState(0);
  const zones_geodata = useSelector((state: StateType) => {
    if(!state||!state.zones_geodata) {
      return null;
    }
    return state.zones_geodata;
  });
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;

  const mapContainer = useRef(null);

  // Define mapStateTypeainer;
  const [publicZones, setPublicZones] = useState(null);
  const [didMapLoad, setDidMapLoad] = useState(false);
  const [didMapDrawLoad, setDidMapDrawLoad] = useState(false);
  const [lng] = useState((stateLayers.mapextent && stateLayers.mapextent[0]) ? (stateLayers.mapextent[0] + stateLayers.mapextent[2]) / 2 : 4.4671854);
  const [lat] = useState((stateLayers.mapextent && stateLayers.mapextent[1]) ? (stateLayers.mapextent[1] + stateLayers.mapextent[3]) / 2 : 51.9250836);
  const [zoom] = useState(stateLayers.zoom || 15);
  const [didInitSourcesAndLayers, setDidInitSourcesAndLayers] = useState(false);
  const [didAddPublicZones, setDidAddPublicZones] = useState(false);
  const [didAddAdminZones, setDidAddAdminZones] = useState(false);
  const [activeLayers, setActiveLayers] = useState([]);
  let map = useRef(null);

  const userData = useSelector((state: StateType) => {
    return state.authentication.user_data;
  });

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setUriParams(location ? location.search : null);
  }, [location]);

  const getAdminZones = async () => {
    const sortedZones = await fetchAdminZones(token, filterGebied);

    setPublicZones(sortedZones);
  }

  const getPublicZones = async () => {
    const sortedZones = await fetchPublicZones(filterGebied);

    setPublicZones(sortedZones);
  }

  const applyMapSettings = (theMap) => {
    // Hide compass control
    theMap.addControl(new maplibregl.NavigationControl({
      showCompass: false
      // showZoom: false
    }), 'bottom-right');

    // Add 'current location' button
    theMap.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'bottom-right'
    );

    // Disable rotating
    theMap.dragRotate.disable();
    theMap.touchZoomRotate.disableRotation();
  }

  const registerMapView = useCallback(theMap => {
    const bounds = theMap.getBounds();
    const payload = [
      bounds._sw.lng,
      bounds._sw.lat,
      bounds._ne.lng,
      bounds._ne.lat
    ]

    dispatch({ type: 'LAYER_SET_MAP_EXTENT', payload: payload })
    dispatch({ type: 'LAYER_SET_MAP_ZOOM', payload: theMap.getZoom() })
  }, []);

  // Init MapLibre map
  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  // const mapcurrent_exists = map.current!==undefined;
  useEffect(() => {
    const initMap = () => {
      // Stop if map exists already
      if (map.current) return;

      const mapStyles = getMapStyles();

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        // @ts-ignore
        style: mapStyles.base,
        accessToken: process ? process.env.REACT_APP_MAPBOX_TOKEN : '',
        center: [lng, lat],
        zoom: zoom,
        maxZoom: 21,
        attributionControl: false// Hide info icon
      });

      // Apply settings like disabling rotating the map
      applyMapSettings(map.current)

      // Init MapBox utils
      U.init(map.current, maplibregl);
      
      // Map event handlers
      map.current.on('error', function(e) {
        if(process && process.env.DEBUG) console.log('An error event occurred.', e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });
      map.current.on('idle', function(e) {
        if(process && process.env.DEBUG) console.log('An idle event occurred.', e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });
      map.current.on('moveend', function() {
        registerMapView(map.current);
      })
      map.current.on('zoomend', function() {
        registerMapView(map.current);
      })

      // Do a state update if map is loaded
      map.current.on('load', function() {

        // Store map in a global variable
        window['ddMap'] = map.current;

        setDidMapLoad(true)

        addSources(map.current);
        addLayers(map.current);

        setDidInitSourcesAndLayers(true);

        // Add cross image to use for retirement hubs
        map.current.loadImage('https://cdn0.iconfinder.com/data/icons/blueberry/32/delete.png', (err, image) => {
          if(err) throw err;
          map.current.addImage('pattern', image);
        });

        // Add 'Mijksenaar' hub logo for Beleidshubs, if zoomed out
        map.current.loadImage('https://dashboarddeelmobiliteit.nl/components/MapComponent/hub-icon-mijksenaar.png', (err, image) => {
          if(err) throw err;
          map.current.addImage('hub-icon-mijksenaar', image);
        });
      });

      // Disable rotating
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();
    }
    initMap();
  }, [
    lng,
    lat,
    zoom,
    mapContainer,
    // dispatch,
    registerMapView
  ])

  // If on Zones page and geographyId is in URL -> navigate to zone
  useEffect(() => {
    if(! didMapLoad) return;
    if(! didAddPublicZones && ! didAddAdminZones) return;

    // Check if we are on the zones page
    if(window.location.pathname.indexOf('/map/zones/') <= -1 && window.location.pathname.indexOf('/admin/zones/') <= -1) return;
    // Get geographyId from URL
    const geographyId = pathName.split('/zones/')[1];
    // Go for it.
    navigateToGeography(geographyId, publicZones)
    // Only for admin page: Make polygon active
    if(window.location.pathname.indexOf('/admin/zones/') > -1) {
      // Wait until theDraw has been loaded
      setTimeout(x => {
        triggerGeographyClick(geographyId, publicZones)
      }, 2500);
    }
  }, [
    didMapLoad,
    didAddPublicZones,
    didAddAdminZones
  ])

  // If on Map page and gm_zone is in URL -> navigate to place
  useEffect(() => {
    if(! didMapLoad) return;

    // Get gm_code from URL
    const queryParams = new URLSearchParams(window.location.search);
    const gm_code = queryParams.get("gm_code");

    if(gm_code) {
      dispatch({
        type: 'SET_FILTER_GEBIED',
        payload: gm_code
      })
    }
  }, [
    didMapLoad,
    didAddPublicZones,
    didAddAdminZones
  ])

  /**
   * SET SOURCES AND LAYERS
  */

  // Set active source
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! didMapLoad) return;
    if(! map.current.isStyleLoaded()) return;

    const activateSources = () => {
      props.activeSources.forEach(sourceName => {
        map.current.U.showSource(sourceName);
      });
      Object.keys(sources).forEach((key, idx) => {
        if(props.activeSources.indexOf(key) <= -1) {
          // Don't remove if source does not exist :)
          if(! map.current.isSourceLoaded(key)) return;
          map.current.U.hideSource(key);
        }
      });
    }

    activateSources()
  }, [
    didInitSourcesAndLayers,
    JSON.stringify(props.activeSources),
    mapStyle
  ])

  // Set active layers
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;

    activateLayers(map.current, layers, props.layers);
  }, [
    didInitSourcesAndLayers,
    JSON.stringify(props.layers)
  ])

  // Set vehicles sources
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! vehicles.data || vehicles.data.length <= 0) return;

    if(map.current.getSource('vehicles')) {
      map.current.U.setData('vehicles', vehicles.data);
    }
    if(map.current.getSource('vehicles-clusters')) {
      map.current.U.setData('vehicles-clusters', vehicles.data);
    }
  }, [
    didInitSourcesAndLayers,
    vehicles.data
  ]);

  // Set zones source
  useEffect(()   => {
    if(! didInitSourcesAndLayers) return;
    if(! zones_geodata || zones_geodata.data.length <= 0) return;
    if(! map.current) return;

    map.current.U.setData('zones-geodata', zones_geodata.data);
  }, [
    didInitSourcesAndLayers,
    zones_geodata,
    zones_geodata.data,
  ]);

  // Set rentals origins source
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! rentals || ! rentals.origins || Object.keys(rentals.origins).length <= 0) return;

    map.current.U.setData('rentals-origins', rentals.origins);
    map.current.U.setData('rentals-origins-clusters', rentals.origins);
  }, [
    didInitSourcesAndLayers,
    rentals,
    rentals.origins
  ]);

  // Set rentals destinations source
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! rentals || ! rentals.destinations || Object.keys(rentals.destinations).length <= 0) return;

    map.current.U.setData('rentals-destinations', rentals.destinations);
    map.current.U.setData('rentals-destinations-clusters', rentals.destinations);
  }, [
    didInitSourcesAndLayers,
    rentals,
    rentals.destinations
  ]);

  /**
   * /SET SOURCES AND LAYERS
  */

  // If area selection (place/zone) changes, navigate to area
  useEffect(() => {
    if(! map.current) return;
    if(! extent || extent.length === 0) {
      return;
    }
    // Do not zoom to place if zone geography is in URL
    const hasZoneInUrl = () => {
      // Check if we are on the zones page
      if(window.location.pathname.indexOf('/map/zones/') <= -1 && window.location.pathname.indexOf('/admin/zones/') <= -1) return false;
      // Get geographyId from URL
      const geographyId = pathName.split('/zones/')[1];
      return geographyId ? true : false;
    }
    if(hasZoneInUrl()) return;
    
    map.current.fitBounds(extent);
    
    // Reset extent action
    dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: [] });
  }, [
    extent,
    // dispatch
  ])

  // Init popup logic
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! providers) return;

    const isAnalyst = (email) => {
      // Define email addresses of analysts
      const analystEmailAddresses = [
        'mail@bartroorda.nl',
        'sven.boor@gmail.com'
      ]
      // Return true if user is analyst
      return analystEmailAddresses.indexOf(email) > -1;
    }

    const isProvider = (user) => {
      return user.registrations && user.registrations[0].roles.indexOf('operator') > -1;
    }

    // Only S&B and providers can see vehicle ID
    const canSeeVehicleId = () => {
      // If user isn't logged in, it's no analyst
      if(! userData || ! userData.user) {
        return false;
      }
      // Return true if user is logged in
      return true;
      // Return if user can see vehicle ID
      // return isAnalyst(userData.user.email) || isProvider(userData.user);
    }

    initPopupLogic(map.current, providers, canSeeVehicleId(), filter.datum)
  }, [
    didInitSourcesAndLayers,
    providers,
    filter.datum
  ])

  // Init clusters click handler
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;

    initClusters(map.current)
  }, [
    didInitSourcesAndLayers
  ])

  // Add provider images/icons
  useEffect(() => {
    const addProviderImage = async(aanbieder) => {
      let baselabel = aanbieder.system_id + (stateLayers.displaymode === 'displaymode-rentals' ? '-r' : '-p')
      if (map.current.hasImage(baselabel + ':0')) {
        // console.log("provider image for %s already exists", baselabel);
        return;
      }
      var value;
      if(stateLayers.displaymode === 'displaymode-rentals') {
        value = await getVehicleMarkers_rentals(aanbieder.color);
      } else {
        value = await getVehicleMarkers(aanbieder.color);
      }
      value.forEach((img, idx) => {
        map.current.addImage(baselabel + `:` + idx, { width: 50, height: 50, data: img});
      });
    };
    providers.forEach(aanbieder => {
      addProviderImage(aanbieder);
    });
  }, [
    providers,
    stateLayers.displaymode
  ]);

  return <>
    {/* The map container (HTML element) */}
    <div ref={mapContainer} className="map flex-1" />
    {/* H3 layer */}
    <DdH3HexagonLayer map={map.current} />
    {/* Isochrone layer */}
    {isLoggedIn ? <IsochroneTools /> : null}
    {/* Service areas layer */}
    {stateLayers.displaymode === 'displaymode-park' && <DdParkEventsLayer map={map.current} />}
    {stateLayers.displaymode === 'displaymode-rentals' && <DdRentalsLayer map={map.current} />}
    {stateLayers.displaymode === 'displaymode-service-areas' && <DdServiceAreasLayer map={map.current} />}
    {stateLayers.displaymode === 'displaymode-policy-hubs' && <>
      <DdPolicyHubsLayer map={map.current} />
      <SearchBar />
    </>}
  </>
}

export {
  MapComponent
}
