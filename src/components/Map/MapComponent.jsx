import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
import localization from 'moment/locale/nl'
import {useLocation} from "react-router-dom";
import center from '@turf/center'

// MapBox utils
// https://www.npmjs.com/package/mapbox-gl-utils
// https://github.com/mapbox/mapbox-gl-js/issues/1722#issuecomment-460500411
import U from 'mapbox-gl-utils';
import {getMapStyles, setMapStyle} from './MapUtils/map.js';
import {initPopupLogic} from './MapUtils/popups.js';
import {initClusters} from './MapUtils/clusters.js';
import {addIsochronesToMap} from './MapUtils/isochrones.js';
import {
  addLayers,
  activateLayers
} from './MapUtils/layers.js';
import {addSources} from './MapUtils/sources.js';
import {
  addAdminZonesToMap,
  addPublicZonesToMap,
  initMapDrawLogic,
  initPublicZonesMap,
  navigateToGeography,
  triggerGeographyClick,
  fetchPublicZones
} from './MapUtils/zones.js';

// Import API functions
import {
  getIsochronesForFootWalking
} from '../../api/isochrones';

import './MapComponent.css';

import {layers} from './layers';
import {sources} from './sources.js';
import {getVehicleMarkers, getVehicleMarkers_rentals} from './../Map/vehicle_marker.js';

// Set language for momentJS
moment.updateLocale('nl', localization);

function MapComponent(props) {
  if(process.env.DEBUG) console.log('Map component')

  const [pathName, setPathName] = useState(document.location.pathname);
  const [uriParams, setUriParams] = useState(document.location.search);
  const [isochroneMarker, setIsochroneMarker] = useState(false);

  const token = useSelector(state => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : null;
  });

  // Connect to redux store
  const dispatch = useDispatch()

  // Get data from store
  const vehicles = useSelector(state => state.vehicles || null);
  const filter = useSelector(state => state.filter || null);
  const rentals = useSelector(state => state.rentals || null);
  const stateLayers = useSelector(state => state.layers || null);
  const isLoggedIn = useSelector(state => state.authentication.user_data ? true : false);
  const providers = useSelector(state => (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : []);
  const extent/* map boundaries */ = useSelector(state => state.layers ? state.layers.extent : null);
  const [counter, setCounter] = useState(0);
  const zones_geodata = useSelector(state => {
    if(!state||!state.zones_geodata) {
      return null;
    }
    return state.zones_geodata;
  });

  // Define map
  const mapContainer = props.mapContainer;
  const [publicZones, setPublicZones] = useState(null);
  const [didMapLoad, setDidMapLoad] = useState(false);
  const [didMapDrawLoad, setDidMapDrawLoad] = useState(false);
  const [lng] = useState((stateLayers.mapextent && stateLayers.mapextent[0]) ? (stateLayers.mapextent[0] + stateLayers.mapextent[2]) / 2 : 4.4671854);
  const [lat] = useState((stateLayers.mapextent && stateLayers.mapextent[1]) ? (stateLayers.mapextent[1] + stateLayers.mapextent[3]) / 2 : 51.9250836);
  const [zoom] = useState(stateLayers.zoom || 15);
  const [didInitSourcesAndLayers, setDidInitSourcesAndLayers] = useState(false);
  const [didAddPublicZones, setDidAddPublicZones] = useState(false);
  let map = useRef(null);

  const userData = useSelector(state => {
    return state.authentication.user_data;
  });

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setUriParams(location ? location.search : null);
  }, [location]);

  // Get public zones on component load
  useEffect(x => {
    getPublicZones();
  }, [])

  const getPublicZones = async () => {
    const zones = await fetchPublicZones(filterGebied);
    setPublicZones(zones);
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
        style: mapStyles.base,
        accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
        center: [lng, lat],
        zoom: zoom,
        maxZoom: 19,
        attributionControl: false// Hide info icon
      });

      // Apply settings like disabling rotating the map
      applyMapSettings(map.current)

      // Init MapBox utils
      U.init(map.current, maplibregl);
      
      // Map event handlers
      map.current.on('error', function(e) {
        if(process.env.DEBUG) console.log('An error event occurred.', e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });
      map.current.on('idle', function(e) {
        if(process.env.DEBUG) console.log('An idle event occurred.', e);
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
        window.ddMap = map.current;

        setDidMapLoad(true)

        addSources(map.current);
        addLayers(map.current);

        setDidInitSourcesAndLayers(true);
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

  // If geographyId is in URL -> navigate to zone
  useEffect(() => {
    if(! didMapLoad) return;

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
      }, 1000);
    }
  }, [
    didMapLoad,
  ])

  // Init drawing functionality (for drawing zones)
  useEffect(() => {
    if(! didMapLoad) return;
    if(! map.current) return;
    if(! stateLayers) return;

    // Only init map draw features if on zones admin page
    if(stateLayers.displaymode !== 'displaymode-zones-admin') return;

    // Init map drawing features
    initMapDrawLogic(map.current);

    // Switch to satelite view
    setTimeout(() => {
      const mapStyles = getMapStyles();
      setMapStyle(window.ddMap, mapStyles.satelite);
    }, 5);
  }, [
    didMapLoad,
    stateLayers.displaymode
  ]);

  // Init public zones map (if needed)
  useEffect(() => {
    if(! didMapLoad) return;
    // If we did add public zones already: return
    // if( didAddPublicZones) return;

    // Only init map draw features if on zones admin page
    if(stateLayers.displaymode === 'displaymode-zones-public') {
      // ADD zone layers
      initPublicZonesMap(map.current)
      // Switch to base map
      setTimeout(() => {
        const mapStyles = getMapStyles();
        setMapStyle(window.ddMap, mapStyles.base);
      }, 5);
    } else {
      // REMOVE zone layers
      // Not needed, because the layer does hide itself automatically on page change
    }

    setDidAddPublicZones(true);
  }, [
    didMapLoad,
    didAddPublicZones,
    stateLayers.displaymode
  ]);

  // Auto reload zones on displaymode update
  // only on the zones-page (public or admin)
  useEffect(() => {
    if(stateLayers.displaymode.indexOf('displaymode-zones') <= -1) return;
    getPublicZones();
  }, [
    stateLayers.displaymode
  ]);

  // Switch to satelite -> view automatically
  // let TO_local;
  useEffect(x => {
    if(! didMapLoad) return;
    if(! stateLayers.displaymode) return;
    if(! window.ddMap.isStyleLoaded()) return;

    const mapStyles = getMapStyles();

    // Switch from satelite to base view
    let TO_local;
    if(stateLayers.displaymode.indexOf('displaymode-zones') <= -1) {
      TO_local = setTimeout(() => {
        setMapStyle(window.ddMap, mapStyles.base);
      }, 100);
    }
    return () => {
      clearTimeout(TO_local);
    }
  }, [
    didMapLoad,
    didInitSourcesAndLayers,
    stateLayers.displaymode
  ]);

  /**
   * MICROHUBS / ZONES [ADMIN] LOGIC
   * 
   * Load zones onto the map
  */
  useEffect(x => {
    if(! didMapLoad) return;

    // If we are not on zones page: remove all drawed zones from the map
    if(! stateLayers || stateLayers.displaymode !== 'displaymode-zones-admin') {
      // Delete draws
      if(window.CROW_DD && window.CROW_DD.theDraw) {
        window.CROW_DD.theDraw.deleteAll();
        // #TODO Not sure why this is needed.
        // If the timeout is not here, the draw polygons keep visible
        // if you witch from zones-admin to zones-public
        setTimeout(() => {
          window.CROW_DD.theDraw.deleteAll();
        }, 500);
      }
      // Also, hide isochrones layer
      window.ddMap.U.hide('zones-isochrones')
      return;
    }

    (async () => {
      // Remove existing zones first
      window.CROW_DD.theDraw.deleteAll();
      const filter = {
        municipality: filterGebied
      }
      addAdminZonesToMap(token, filter);
      setDidMapDrawLoad(true)
      // Force DOM update
      setCounter(counter+1)
    })()

    return;
  }, [
    didMapLoad,
    stateLayers.displaymode,
    filterGebied
  ])

  /**
   * MICROHUBS / ZONES [PUBLIC] LOGIC
   * 
   * Load zones onto the map
  */
  useEffect(x => {
    // Make sure map loaded
    if(! didMapLoad) return;
    // Make sure mapDraw loaded
    if(! window.CROW_DD || ! window.CROW_DD.theDraw) return;

    // If we are not on zones page: remove all drawed zones from the map
    if(! stateLayers || stateLayers.displaymode !== 'displaymode-zones-public') {
      if(window.CROW_DD && window.CROW_DD.theDraw) {
        window.CROW_DD.theDraw.deleteAll();
      }
      return;
    }
    // If on zones page: add zones to map
    (async () => {
      // Remove existing zones fist
      window.CROW_DD.theDraw.deleteAll();
      const filter = {
        municipality: filterGebied
      }
      addPublicZonesToMap(token, filter);
      setDidMapDrawLoad(true)
    })()
  }, [
    didMapLoad,
    stateLayers.displaymode,
    filterGebied
  ])

  /**
   * SET SOURCES AND LAYERS
  */

  // Set active source
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;

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
    JSON.stringify(props.activeSources)
  ])

  // Set active layers
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;
    // if(! map.current.isStyleLoaded()) return;

    activateLayers(map.current, layers, props.layers);
  }, [
    didInitSourcesAndLayers,
    JSON.stringify(props.layers)
  ])

  // Set vehicles sources
  useEffect(x => {
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
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;
    if(! zones_geodata || zones_geodata.data.length <= 0) return;

    map.current.U.setData('zones-geodata', zones_geodata.data);
  }, [
    didInitSourcesAndLayers,
    zones_geodata,
    zones_geodata.data,
  ]);

  // Set rentals origins source
  useEffect(x => {
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
  useEffect(x => {
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
    
    // reset extent action
    dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: [] });
  }, [
    extent,
    // dispatch
  ])

  // Init popup logic
  useEffect(() => {
    if(! didInitSourcesAndLayers) return;
    if(! providers) return;

    initPopupLogic(map.current, providers, isLoggedIn, filter.datum)
  }, [
    didInitSourcesAndLayers,
    providers,
    isLoggedIn,
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

  // Add isochrone marker
  const addIsochroneMarker = (theMap) => {
    if(! theMap) return;
    if(isochroneMarker) return;

    const addIsochronesForLngLat = async (theMap, lng, lat) => {
      // Get foot walking isochrones
      const result = await getIsochronesForFootWalking(lng, lat);
      addIsochronesToMap(theMap, result)
      return;
    }

    const onDragEnd = async () => {
      const lngLat = marker.getLngLat();
      await addIsochronesForLngLat(theMap, lngLat.lng, lngLat.lat)
    }

    // Get center of map
    const {lng, lat} = theMap.getCenter();
    var marker = new maplibregl.Marker({
      draggable: true
    })
    .setLngLat([lng, lat])
    .addTo(theMap);
  
    // Add isochrones around the new marker
    addIsochronesForLngLat(theMap, lng, lat)

    marker.on('dragend', onDragEnd);

    setIsochroneMarker(marker);
  }

  // Remove isochrone marker
  const removeIsochroneMarker = (theMap) => {
    if(! isochroneMarker) return;
    // Remove it
    isochroneMarker.remove();

    // Update state
    setIsochroneMarker(null);

    // Hide isochrones layer
    theMap.U.hide('zones-isochrones')
  }

  const doShowIsochroneButton = () => {
    const validEmailAddresses = [
      'mail@bartroorda.nl',
      'rinse.gorter@denhaag.nl',
      'otto.vanboggelen@crow.nl',
      'sven.boor@gmail.com'
    ]
    return userData && userData.user && validEmailAddresses.indexOf(userData.user.email) > -1;
  }

  // Add map controls for isochrone view
  return doShowIsochroneButton ? (
    <>
      <div className="fixed bg-white p-1" style={{
        bottom: '117px',
        right: '10px',
        borderRadius: '4px',
        minWidth: '29px',
        textAlign: 'center',
        boxShadow: '0 0 0 2px rgb(0 0 0 / 10%)'
      }}>
        {! isochroneMarker && <div 
          className="cursor-pointer"
          onClick={() => {addIsochroneMarker(window.ddMap)}}
          title="Voeg punt voor isochronenweergave toe"
        >
          ⚓
        </div>}
        {isochroneMarker && <div 
          className="cursor-pointer"
          onClick={() => {removeIsochroneMarker(window.ddMap)}}
          title="Stop isochronenweergave"
        >
          ❎
        </div>}
      </div>
    </>
  ) : null;
}

export {
  MapComponent
};
