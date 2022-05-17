import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
import localization from 'moment/locale/nl'

// Mapbox draw functionality
// https://github.com/mapbox/mapbox-gl-draw
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

// MapBox utils
// https://www.npmjs.com/package/mapbox-gl-utils
// https://github.com/mapbox/mapbox-gl-js/issues/1722#issuecomment-460500411
import U from 'mapbox-gl-utils';
import {initPopupLogic} from './MapUtils/popups.js';
import {initClusters} from './MapUtils/clusters.js';
import {addZonesToMap} from './MapUtils/zones.js';

import './MapComponent.css';

import {layers} from './layers';
import {sources} from './sources.js';
import {getVehicleMarkers, getVehicleMarkers_rentals} from './../Map/vehicle_marker.js';

// Set language for momentJS
moment.updateLocale('nl', localization);

function MapComponent(props) {
  if(process.env.DEBUG) console.log('Map component')

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
  const zones_geodata = useSelector(state => {
    if(!state||!state.zones_geodata) {
      return null;
    }
    return state.zones_geodata;
  });

  // Define map
  const mapContainer = props.mapContainer;
  const [didMapLoad, setDidMapLoad] = useState(false);
  const [lng] = useState((stateLayers.mapextent && stateLayers.mapextent[0]) ? (stateLayers.mapextent[0] + stateLayers.mapextent[2]) / 2 : 4.4671854);
  const [lat] = useState((stateLayers.mapextent && stateLayers.mapextent[1]) ? (stateLayers.mapextent[1] + stateLayers.mapextent[3]) / 2 : 51.9250836);
  const [zoom] = useState(stateLayers.zoom || 15);
  // const [counter, setCounter] = useState(0);
  // const [sourceCounter, setSourceCounter] = useState(0);
  // const [sourcesSuccesfullyAdded, setSourcesSuccesfullyAdded] = useState(false);
  const [didInitSourcesAndLayers, setDidInitSourcesAndLayers] = useState(false);
  // const [zonesGeodataHash, setZonesGeodataHash] = useState("");
  // const [sourceHash, setSourceHash] = useState([]);
  let map = useRef(null);

  const applyMapSettings = (theMap) => {
    // Hide compass control
    theMap.addControl(new maplibregl.NavigationControl({
      showCompass: false
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

  const initMapDrawLogic = (theMap) => {
    if(! theMap) return;
    const draw = new MapboxDraw({
      displayControlsDefault: false
    });
    // for more details: https://docs.mapbox.com/mapbox-gl-js/api/#map#addcontrol
    theMap.addControl(draw, 'top-left');
    // Set Draw to window, for easily making global changes
    if(window.CROW_DD) {
      window.CROW_DD.theDraw = draw;
    } else {
      window.CROW_DD = {theDraw: draw}
    }
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
  }, [dispatch]);

  // Init MapLibre map
  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  // const mapcurrent_exists = map.current!==undefined;
  useEffect(() => {
    const addSources = () => {
      Object.keys(sources).forEach((key, idx) => {
        map.current.U.addGeoJSON(key, null, sources[key]);
      })
    }
    const addLayers = () => {
      Object.keys(layers).forEach((key, idx) => {
        map.current.U.addLayer(layers[key]);
      })
    }
    const initMap = () => {
      const style = 'mapbox://styles/nine3030/ckv9ni7rj0xwq15qsekqwnlz5';//TODO: Move to CROW

      // Stop if map exists already
      if (map.current) return;

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style,
        accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
        center: [lng, lat],
        zoom: zoom,
        maxZoom: 19,
        attributionControl: false// Hide info icon
      });

      // Apply settings like disabling rotating the map
      applyMapSettings(map.current)

      // Apply settings like disabling rotating the map
      initMapDrawLogic(map.current)

      // Init MapBox utils
      U.init(map.current);
      
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

        addSources()
        addLayers()

        setDidInitSourcesAndLayers(true)
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
    dispatch,
    registerMapView
  ])

  /**
   * MICROHUBS / ZONES LOGIC
  */
  useEffect(x => {
    if(! didMapLoad) return;
    addZonesToMap(map.current);
  }, [didMapLoad])

  /**
   * /MICROHUBS / ZONES LOGIC
  */

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
          map.current.U.hideSource(key);
        }
      });
    }

    activateSources()
  }, [
    didInitSourcesAndLayers,
    props.activeSources
  ])

  // Set active layers
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;

    const activateLayers = (layerName) => {
      // Show given layers
      props.layers.forEach(l => {
        map.current.U.show(l);
      });

      // Hide all other layers
      Object.keys(layers).forEach((key, idx) => {
        if(props.layers.indexOf(key) <= -1) {
          map.current.U.hide(key);
        }
      })
    }

    activateLayers()
  }, [
    didInitSourcesAndLayers,
    props.layers
  ])

  // Set vehicles sources
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;
    if(! vehicles.data || vehicles.data.length <= 0) return;

    map.current.U.setData('vehicles', vehicles.data);
    map.current.U.setData('vehicles-clusters', vehicles.data);
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
    
    map.current.fitBounds(extent);
    
    // reset extent action
    dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: [] });
  }, [
    extent,
    dispatch
  ])

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

  return null;
}

export {
  MapComponent
};
