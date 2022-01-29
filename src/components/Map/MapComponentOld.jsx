import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
// import 'moment/min/moment-with-locales'
import localization from 'moment/locale/nl'

import './MapComponent.css';

import {getProviderColor} from '../../helpers/providers.js';

import {layers} from './layers';
import {sources} from './sources.js';
import {getVehicleMarkers, getVehicleMarkers_rentals} from './../Map/vehicle_marker.js';

import JSConfetti from 'js-confetti'

const md5 = require('md5');

// Set language for momentJS
moment.locale('nl', localization);

const jsConfetti = new JSConfetti()
window.showConfetti = () => {
  jsConfetti.addConfetti()
  jsConfetti.addConfetti({
    emojis: ['🚲', '🚲', '🚴‍♀️', '🛵', '🛴', '🚗', '🚙', '✨', '✨'],
    emojiSize: 30,
    confettiNumber: 100,
  })
}

const providerWebsiteUrls = {
  'baqme': 'https://www.baqme.com/',
  'cykl': 'https://www.cykl.nl/',
  'check': 'https://ridecheck.app/',
  'cargoroo': 'https://cargoroo.nl/',
  'deelfietsnederland': 'https://deelfietsnederland.nl/',
  'donkey': 'https://www.donkey.bike/',
  'felyx': 'https://felyx.com/',
  'flickbike': 'https://www.flickbike.nl/',
  'gosharing': 'https://go-sharing.com/',
  'hely': 'https://hely.com/',
  'htm': 'https://www.htm.nl/ons-vervoer/htm-fiets',
  'keobike': 'https://keobike.nl/',
  'lime': 'https://www.li.me/',
  'tier': 'https://www.tier.app/',
  'uwdeelfiets': 'https://www.uwdeelfiets.nl/',
}

// Init Cluster event handlers
const initClusters = (currentMap) => {
  ['vehicles-clusters', 'rentals-origins-clusters', 'rentals-destinations-clusters'].forEach(x => {
    currentMap.on('click', x, function (e) {
      var features = currentMap.queryRenderedFeatures(e.point, {
        layers: [x]
      });
      var clusterId = features[0].properties.cluster_id;
      currentMap.getSource(x).getClusterExpansionZoom(
        clusterId,
        function (err, zoom) {
          if (err) return;
          currentMap.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });
    currentMap.on('mouseenter', x, function () {
      currentMap.getCanvas().style.cursor = 'pointer';
    });
    currentMap.on('mouseleave', x, function () {
      currentMap.getCanvas().style.cursor = '';
    });
  })
}

const initPopupLogic = (currentMap, providers, isLoggedIn) => {
  // Docs: https://maplibre.org/maplibre-gl-js-docs/example/popup-on-click/
  const layerNamesToApplyPopupLogicTo = [
    'vehicles-point',
    'vehicles-clusters-point',
    'rentals-origins-point',
    'rentals-origins-clusters-point',
    'rentals-destinations-point',
    'rentals-destinations-clusters-point',
  ];

  layerNamesToApplyPopupLogicTo.forEach((layerName) => {
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    currentMap.on('click', layerName, function (e) {
      const vehicleProperties = e.features[0].properties;
      const providerColor = getProviderColor(providers, vehicleProperties.system_id)

      var coordinates = e.features[0].geometry.coordinates.slice();
      // var description = e.features[0].properties.description;
       
      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <h1 class="mb-2">
            <span
              class="rounded-full inline-block w-4 h-4"
              style="background-color: ${providerColor};position: relative;top: 2px"
              onClick="window.showConfetti()"
              >
            </span>
            <span class="Map-popup-title ml-1" style="color: ${providerColor};">
              ${vehicleProperties.system_id}
            </span>
          </h1>
          <div class="Map-popup-body">
            ${vehicleProperties.in_public_space_since ? `<div>
              Staat hier sinds ${moment(vehicleProperties.in_public_space_since).locale('nl').fromNow()}<br />
              Geparkeerd sinds: ${moment(vehicleProperties.in_public_space_since).format('DD-MM-YYYY HH:mm')}
            </div>` : ''}

            ${vehicleProperties.distance_in_meters ? `<div>
              Dit voertuig is ${vehicleProperties.distance_in_meters} meter verplaatst<br />
            </div>` : ''}

            ${providerWebsiteUrls && providerWebsiteUrls[vehicleProperties.system_id] ? `<div class="mt-2">
              <a href="${providerWebsiteUrls[vehicleProperties.system_id]}" rel="external" target="_blank" class="inline-block py-1 px-2 text-white rounded-md hover:opacity-80" style="background-color: ${providerColor};">
                website
              </a>
            </div>` : ''}
          </div>
        `)
        .addTo(currentMap);
    });
    // Change the cursor to a pointer when the mouse is over the places layer.
    currentMap.on('mouseenter', layerName, function () {
      currentMap.getCanvas().style.cursor = 'pointer';
    });
     
    // Change it back to a pointer when it leaves.
    currentMap.on('mouseleave', layerName, function () {
      currentMap.getCanvas().style.cursor = '';
    });
  })
   
}

function MapComponent(props) {
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
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [lng] = useState((stateLayers.mapextent && stateLayers.mapextent[0]) ? (stateLayers.mapextent[0] + stateLayers.mapextent[2]) / 2 : 4.4671854);
  const [lat] = useState((stateLayers.mapextent && stateLayers.mapextent[1]) ? (stateLayers.mapextent[1] + stateLayers.mapextent[3]) / 2 : 51.9250836);
  const [zoom] = useState(stateLayers.zoom || 15);
  const [counter, setCounter] = useState(0);
  const [sourceCounter, setSourceCounter] = useState(0);
  // const [zonesGeodataHash, setZonesGeodataHash] = useState("");
  const [sourceHash, setSourceHash] = useState([]);
  let map = useRef(null);

  function setLayerSource(layerId, source, sourceLayer) {
    const oldLayers = map.current.getStyle().layers;
    const layerIndex = oldLayers.findIndex(l => l.id === layerId);
    const layerDef = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
    layerDef.source = source;
    if (sourceLayer) {
      layerDef['source-layer'] = sourceLayer;
    }
    map.current.removeLayer(layerId);
    map.current.addLayer(layerDef, before);
  }

  // Init MapLibre map
  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  useEffect(() => {
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

      // Hide compass control
      map.current.addControl(new maplibregl.NavigationControl({
        showCompass: false
      }), 'bottom-right');

      // Add 'current location' button
      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
      }), 'bottom-right');
  
      // Do a state update if map is loaded
      map.current.on('load', function() {
        window.ddMap = map.current;
        if(map.current.isStyleLoaded()) {
          setIsStyleLoaded(true)
        }
      });
      
      // map.current.on('data', function(e) {
      //   console.log('A data event occurred.',e);
      //   // We do not show loading, because this event happens on zoom and map navigate
      //   dispatch({type: 'SHOW_LOADING', payload: true});
      // });

      // map.current.on('sourcedataloading', function(e) {
      //   console.log('A sourcedataloading event occurred.',e);
      //   // We do not show loading, because this event happens on zoom and map navigate
      //   dispatch({type: 'SHOW_LOADING', payload: true});
      // });

      // map.current.on('sourcedata', function(e) {
      //   console.log('A sourcedata event occurred.',e);
      // });

      map.current.on('error', function(e) {
        if(process.env.DEBUG) console.log('An error event occurred.',e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });
      map.current.on('idle', function(e) {
        if(process.env.DEBUG) console.log('An idle event occurred.',e);
        dispatch({type: 'SHOW_LOADING', payload: false});
      });

      const registerMapView = (currentmap) => {
        const bounds = currentmap.getBounds();
        const payload = [
          bounds._sw.lng,
          bounds._sw.lat,
          bounds._ne.lng,
          bounds._ne.lat
        ]

        dispatch({ type: 'LAYER_SET_MAP_EXTENT', payload: payload })
        dispatch({ type: 'LAYER_SET_MAP_ZOOM', payload: currentmap.getZoom() })
      }

      map.current.on('moveend', function() {
        registerMapView(map.current);
      })

      map.current.on('zoomend', function() {
        registerMapView(map.current);
      })

      // Disable rotating
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();
    }
    initMap();
  }, [

    // vehicles,
    // zones_geodata,
    lng,
    lat,
    zoom,
    // counter,
    mapContainer,
    dispatch
  ])

  const addOrUpdateSource = (sourceName, sourceData) => {

    // If map is not loaded: refresh state after .25 seconds
    if (! map.current || ! map.current.isStyleLoaded()) {
      // setTimeout(() => {
      //   setCounter(counter + 1)
      // }, 500)
      return;
    }

    // If no source data is given -> stop
    if (! sourceData) {
      return;
    }

    // Check if source exists
    const doesSourceExist = map.current.getSource(sourceName);
    console.log('doesSourceExist?', doesSourceExist)
    // Get md5 hash of the data
    let hash = sourceData && sourceData.features ? md5(JSON.stringify(sourceData.features)) : md5('No data yet');
    // If source does exist: update data
    if(doesSourceExist) {
      console.log('source does exist.')
      if(! sourceHash || sourceHash[sourceName] !== hash) {
        // Set hash
        let newSourceHashArray = sourceHash;
        newSourceHashArray[sourceName] = hash;
        setSourceHash(newSourceHashArray);
        // Update data
        map.current.getSource(sourceName).setData(sourceData);
      }
    }

    // If source does not exist: add source
    else {
      console.log('source does not exist.')

      // Set hash
      let newSourceHashArray = sourceHash;
      newSourceHashArray[sourceName] = hash;
      setSourceHash(newSourceHashArray);

      console.log('sourceName', sourceName, 'sourceData', sourceData, 'sourceHash', sourceHash)

      // Set data
      let source = Object.assign({}, {
        'type': 'geojson',
        'data': sourceData,
      }, sources[sourceName] ? sources[sourceName] : {});
      map.current.addSource(sourceName, source);

      setSourceCounter(sourceCounter + 1)
    }
  }

  useEffect(() => {
    // Add zones
    if(zones_geodata && zones_geodata.data) {
      addOrUpdateSource('zones-geodata', zones_geodata.data);
    }
  }, [
    map.current,
    zones_geodata.data,
  ]);

  useEffect(() => {
    // Add park events
    if(vehicles && vehicles.data) {
      addOrUpdateSource('vehicles', vehicles.data);
      addOrUpdateSource('vehicles-clusters', vehicles.data);
    }
  }, [
    map.current,
    vehicles.data
  ])

  useEffect(() => {
    // Add rentals
    if(rentals.origins && rentals.origins.type) {
      addOrUpdateSource('rentals-origins', rentals.origins);
      addOrUpdateSource('rentals-origins-clusters', rentals.origins);
    }
  }, [
    map.current,
    rentals.origins
  ])

  useEffect(() => {
    if(rentals.destinations && rentals.destinations.type) {
      addOrUpdateSource('rentals-destinations', rentals.destinations);
      addOrUpdateSource('rentals-destinations-clusters', rentals.destinations);
    }
  }, [
    map.current,
    rentals.destinations
  ])
  // }, [
  //   map.current,//
  //   vehicles ? (vehicles.data ? vehicles.data.features : vehicles.data) : vehicles,
  //   rentals.origins ? rentals.origins.features : rentals.origins,
  //   rentals.destinations,
  //   zones_geodata,
  //   zonesGeodataHash,
  //   counter,
  //   props.activeSource
  // ])

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
    map.current,
    extent,
    dispatch
  ])
  
  // Add layers
  useEffect(() => {
    console.log('sourceCounter', sourceCounter)
    const addLayers = () => {
      if (! map.current || ! map.current.isStyleLoaded()) {
        return;
      }

      if(! props.layers) {
        return;
      }
      console.log('sourceCounter... ', sourceCounter)

      // Remove 'old' layers
      const allLayers = map.current.getStyle().layers;
      allLayers.forEach(x => {
        // Check if this is one of our layers
        if(x.id.indexOf('vehicles-') > -1) {
          // If so, remove
          map.current.removeLayer(x.id)
        }
        if(x.id.indexOf('rentals-') > -1) {
          // If so, remove
          map.current.removeLayer(x.id)
        }
        if(x.id.indexOf('zones-geodata') > -1) {
          // If so, remove
          map.current.removeLayer(x.id)
          // setZonesGeodataHash("");
        }
      })
      // Add selected layers to the map
      console.log('adding new layers');
      props.layers.forEach(x => {
        if(props.layers.indexOf(x) >= -1) {
          const doesLayerExist = map.current.getLayer(x);
          const doesRelatedSourceExist = map.current.getSource(layers[x].source);
          if(! doesLayerExist && doesRelatedSourceExist) {
            console.log(counter, 'add layer')
            map.current.addLayer(layers[x]);
          } else {
            console.log(counter, 'not added layer. doesLayerExist/doesRelatedSourceExist', doesLayerExist, doesRelatedSourceExist)
          }
        }
      })
      console.log('added new layers')
    }
    addLayers();
  }, [
    // map.current,
    // counter,
    props.layers,
    isStyleLoaded,
    sourceCounter,
    // isLoggedIn,
    // vehicles,
    // rentals.origins,
    // rentals.destinations,
    // zones_geodata,
    // providers
  ]);

  const mapcurrent_exists = map.current!==undefined;
  useEffect(() => {
    if(! map.current) return;
    if(! providers) return;
    initPopupLogic(map.current, providers, isLoggedIn)
  }, [mapcurrent_exists, providers, isLoggedIn])

  // Init clusters click handler
  useEffect(() => {
    if(! map.current) return;
    initClusters(map.current)
  }, [mapcurrent_exists])

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
    // stateLayers.displaymode
  ]);

  return null;
}

export {
  MapComponent
};
