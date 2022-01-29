import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
// import 'moment/min/moment-with-locales'
import localization from 'moment/locale/nl'

// MapBox utils
// https://www.npmjs.com/package/mapbox-gl-utils
// https://github.com/mapbox/mapbox-gl-js/issues/1722#issuecomment-460500411
import U from 'mapbox-gl-utils';

import './MapComponent.css';

import {getProviderColor} from '../../helpers/providers.js';

import {layers} from './layers';
import {sources} from './sources.js';
import {getVehicleMarkers, getVehicleMarkers_rentals} from './../Map/vehicle_marker.js';

import JSConfetti from 'js-confetti'

const md5 = require('md5');

// Set language for momentJS
moment.locale('nl', localization);

function MapComponentMinimal(props) {
  if(process.env.DEBUG) console.log('Map component')

  // Connect to redux store
  const dispatch = useDispatch()

  // Get data from store
  const vehicles = useSelector(state => state.vehicles || null);
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
  const [counter, setCounter] = useState(0);
  const [sourceCounter, setSourceCounter] = useState(0);
  const [sourcesSuccesfullyAdded, setSourcesSuccesfullyAdded] = useState(false);
  const [didInitSourcesAndLayers, setDidInitSourcesAndLayers] = useState(false);
  // const [zonesGeodataHash, setZonesGeodataHash] = useState("");
  const [sourceHash, setSourceHash] = useState([]);
  let map = useRef(null);

  // Init MapLibre map
  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  const mapcurrent_exists = map.current!==undefined;
  useEffect(() => {
    const addSources = () => {
      Object.keys(sources).forEach((key, idx) => {
        map.current.U.addGeoJSON(key);
      })
    }
    const addLayers = () => {
      Object.keys(layers).forEach((key, idx) => {
        console.log('ADD LAYER', key)
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

      // Init MapBox utils
      U.init(map.current);

      // Do a state update if map is loaded
      map.current.on('load', function() {
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
    dispatch
  ])

  // Set active source
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;

    const activateSource = (sourceName) => {
      console.log('props.activeSource', props.activeSource, sourceName)
      map.current.U.showSource(sourceName);
      console.log("ddMap.getStyle().layers", map.current.getStyle().layers)
      Object.keys(sources).forEach((key, idx) => {
        if(key !== sourceName) {
          console.log('HIDE:: ', 'key', key, 'sourceName', sourceName)
          map.current.U.hideSource(key);
        }
      });
    }

    activateSource(props.activeSource)
  }, [
    didInitSourcesAndLayers,
    props.activeSource
  ])

  // Set active layers
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;

    const activateLayers = (layerName) => {
      // Show given layers
      props.layers.forEach(l => {
        console.log('show l: ', l)
        map.current.U.show(l);
      });

      // Hide all other layers
      Object.keys(layers).forEach((key, idx) => {
        if(props.layers.indexOf(key) <= -1) {
          console.log('hide l: ', key)
          map.current.U.hide(key);
        }
      })
    }

    activateLayers()
  }, [
    didInitSourcesAndLayers,
    props.layers
  ])

  // Set vehicles layers/sources
  useEffect(x => {
    if(! didMapLoad) return;
    if(! vehicles.data || vehicles.data.length <= 0) return;

    map.current.U.setData('vehicles', vehicles.data);
    map.current.U.setData('vehicles-clusters', vehicles.data);

  }, [didMapLoad, vehicles.data]);

  useEffect(() => {
    const addProviderImage = async(aanbieder) => {
      let baselabel = aanbieder.system_id + (stateLayers.displaymode === 'displaymode-rentals' ? '-r' : '-p')
      if (map.current.hasImage(baselabel + ':0')) {
        // console.log("provider image for %s already exists", baselabel);
        return;
      }
      // TODO
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
  MapComponentMinimal
};
