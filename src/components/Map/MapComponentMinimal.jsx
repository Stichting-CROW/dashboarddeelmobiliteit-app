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

      // Init MapBox utils
      U.init(map.current);

      // Do a state update if map is loaded
      map.current.on('load', function() {
        // Store map in a global variable
        window.ddMap = map.current;

        setDidMapLoad(true)

        addSources()
        addLayers()

        setDidInitSourcesAndLayers(true)


        // Add a new source from our GeoJSON data and
        // set the 'cluster' option to true. GL-JS will
        // add the point_count property to your source data.
        map.current.addSource('earthquakes', {
          type: 'geojson',
          data: 'https://maplibre.org/maplibre-gl-js-docs/assets/earthquakes.geojson',
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        // map.current.addLayer({
        //   id: 'clusters',
        //   type: 'circle',
        //   source: 'earthquakes',
        //   filter: ['has', 'point_count'],
        //   paint: {
        //     // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
        //     // with three steps to implement three types of circles:
        //     //   * Blue, 20px circles when point count is less than 100
        //     //   * Yellow, 30px circles when point count is between 100 and 750
        //     //   * Pink, 40px circles when point count is greater than or equal to 750
        //     'circle-color': [
        //       'step',
        //       ['get', 'point_count'],
        //       '#51bbd6',
        //       100,
        //       '#f1f075',
        //       750,
        //       '#f28cb1'
        //     ],
        //     'circle-radius': [
        //       'step',
        //       ['get', 'point_count'],
        //       20,
        //       100,
        //       30,
        //       750,
        //       40
        //     ]
        //   }
        // });

        map.current.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'earthquakes',
          filter: ['has', 'point_count'],
          paint: {
            // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              100,
              '#f1f075',
              750,
              '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              100,
              30,
              750,
              40
            ]
          }
        });
           
        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'earthquakes',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        });
           
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'earthquakes',
          filter: ['!', ['has', 'point_count']],
          paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
          }
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
    dispatch
  ])

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
    zones_geodata.data
  ]);

  // Set rentals origins source
  useEffect(x => {
    if(! didInitSourcesAndLayers) return;
    if(! rentals || ! rentals.origins || Object.keys(rentals.origins).length <= 0) return;

    map.current.U.setData('rentals-origins', rentals.origins);
    map.current.U.setData('rentals-origins-clusters', rentals.origins);
  }, [
    didInitSourcesAndLayers,
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
    rentals.destinations
  ]);

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
  MapComponentMinimal
};
