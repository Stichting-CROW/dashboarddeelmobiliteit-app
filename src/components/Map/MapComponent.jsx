import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import moment from 'moment';
// import 'moment/min/moment-with-locales'
import localization from 'moment/locale/nl'

import './MapComponent.css';

import {getProviderColor} from '../../helpers/providers.js';

import {layers} from './layers';
import {sources} from './sources.js';
import getVehicleMarkers from './../Map/vehicle_marker.js';

const md5 = require('md5');

// Set language for momentJS
moment.locale('nl', localization);

const providerWebsiteUrls = {
  'check': 'https://ridecheck.app/',
  'felyx': 'https://felyx.com/',
  'gosharing': 'https://go-sharing.com/'
}

const initPopupLogic = (currentMap, providers, isLoggedIn) => {
  // Docs: https://maplibre.org/maplibre-gl-js-docs/example/popup-on-click/
  const layerNamesToApplyPopupLogicTo = [
    'vehicles-point',
    'vehicles-clusters-point'
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
              style="background-color: ${providerColor};position: relative;top: 2px">
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

            ${providerWebsiteUrls && providerWebsiteUrls[vehicleProperties.system_id] ? `<div>
              <a href="${providerWebsiteUrls[vehicleProperties.system_id]}" rel="external" target="_blank">
                ${providerWebsiteUrls[vehicleProperties.system_id]}
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

  // console.log('Map component')
  // Get vehicles from store
  const vehicles = useSelector(state => {
    return state.vehicles || null;
  });

  const rentals = useSelector(state => {
    return state.rentals || null;
  });

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  // Get extent (map boundaries) from store
  const extent = useSelector(state => {
    return state.layers ? state.layers.extent : null;
  }) || [];

  const providers = useSelector(state => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });

  const zones_geodata = useSelector(state => {
    if(!state||!state.zones_geodata) {
      return null;
    }

    return state.zones_geodata;
  });
  
  const mapContainer = props.mapContainer;
  const [lng] = useState(4.4671854);
  const [lat] = useState(51.9250836);
  const [zoom] = useState(15);
  const [counter, setCounter] = useState(0);
  const [zonesGeodataHash, setZonesGeodataHash] = useState("");
  const [sourceHash, setSourceHash] = useState([]);
  let map = useRef(null);

  // Init MapLibre map
  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  useEffect(() => {
    const initMap = () => {
      // temp code to make map tiles work @ marc
      // const style = {
      //   "version": 8,
      //   "sources": {
      //     "osm": {
      //       "type": "raster",
      //       "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      //       "tileSize": 256,
      //       "attribution": "&copy; OpenStreetMap Contributors",
      //       "maxzoom": 19
      //     }
      //   },
      //   "layers": [
      //     {
      //       "id": "osm",
      //       "type": "raster",
      //       "source": "osm" // This must match the source key above
      //     }
      //   ]
      // };
      const style = 'mapbox://styles/nine3030/ckv9ni7rj0xwq15qsekqwnlz5';
      
      if (map.current) return;
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        // style: 'mapbox://styles/mapbox/streets-v11',
        // style: 'mapbox://styles/nine3030/ckv9ni7rj0xwq15qsekqwnlz5',//TODO: Move to CROW
        style,
        accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
        center: [lng, lat],
        zoom: zoom,
        maxZoom: 19,
        attributionControl: false// Hide info icon
      });

      // Add controls
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
        setCounter(counter + 1)
        window.ddMap = map.current;
      });
      
      // Disable rotating
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();

    }
    initMap();
  }, [vehicles, zones_geodata, lng, lat, zoom, counter, mapContainer])

  const addOrUpdateSource = (sourceName, sourceData) => {

    // If map is not loaded: refresh state after .25 seconds
    if (! map.current || ! map.current.isStyleLoaded()) {
      setTimeout(() => {
        setCounter(counter + 1)
      }, 250)
      return;
    }

    // If no source data is given -> stop
    if (! sourceData) {
      return;
    }

    // Check if source exists
    const doesSourceExist = map.current.getSource(sourceName);
    // Get md5 hash of the data
    let hash = sourceData.data && sourceData.data.features ? md5(JSON.stringify(sourceData.data.features)) : md5('No data yet');
    // If source does exist: update data
    if(doesSourceExist) {
      if(! sourceHash || sourceHash[sourceName] !== hash) {
        // Set hash
        let newSourceHashArray = sourceHash;
        newSourceHashArray[sourceName] = hash;
        setSourceHash(newSourceHashArray);
        // Update data
        map.current.getSource(sourceName).setData(sourceData.data);
        // console.log("Update source zones-geodata %o", zones_geodata)
      } else {
        // console.log("Skip update source zones-geodata %o", zonesGeodataHash, hash)
      }
    }

    // If source does not exist: add source
    else {
      // console.log("Add source zones-geodata %o", zones_geodata)
      if(sourceData) {
        // Set hash
        let newSourceHashArray = sourceHash;
        newSourceHashArray[sourceName] = hash;
        setSourceHash(newSourceHashArray);

        // Set data
        let source = Object.assign({}, {
          'type': 'geojson',
          'data': sourceData.data,
        }, sources[sourceName] ? sources[sourceName] : {});
        map.current.addSource(sourceName, source);
      }
    }
  }

  useEffect(() => {
    addOrUpdateSource('vehicles', vehicles);
    addOrUpdateSource('zones-geodata', zones_geodata);
    addOrUpdateSource('vehicles-clusters', vehicles);
    addOrUpdateSource('rentals', rentals);
    // console.log(vehicles);
    // eslint-disable-next-line
  }, [
    // eslint-disable-next-line
    vehicles ? (vehicles.data ? vehicles.data.features : vehicles.data) : vehicles,
    zones_geodata,
    zonesGeodataHash,
    counter,
    props.activeSource
  ])

  // If area selection (place/zone) changes, navigate to area
  useEffect(() => {
    if(! map.current) return;
    if(! extent || extent.length === 0) return;
    map.current.fitBounds(extent);
  }, [
    extent
  ])

  // Add layers
  useEffect(() => {
    const addLayers = (vehicles, zones_geodata) => {
      if (! map.current || ! map.current.isStyleLoaded()) {
        setTimeout(() => {
          setCounter(counter + 1)
        }, 250)
        return;
      }
      if (!vehicles||!zones_geodata) return;

      // Remove 'old' layers
      const allLayers = map.current.getStyle().layers;
      allLayers.forEach(x => {
        // Check if this is one of our layers
        if(x.id.indexOf('vehicles-') > -1) {
          // If so, remove
          map.current.removeLayer(x.id)
        }
        if(x.id.indexOf('zones-geodata') > -1) {
          // If so, remove
          map.current.removeLayer(x.id)
          setZonesGeodataHash("");
        }
      })
      // Add selected layers to the map
      props.layers.forEach(x => {
        if(props.layers.indexOf(x) >= -1) {
          const doesLayerExist = map.current.getLayer(x);
          if(! doesLayerExist) { map.current.addLayer(layers[x]); }
        }
      })
    }
    addLayers(vehicles, zones_geodata);
    initPopupLogic(map.current, providers, isLoggedIn)
  }, [vehicles, zones_geodata, counter, props.layers, isLoggedIn, providers]);

  useEffect(() => {
    var addProviderImage = async(aanbieder) => {
      if (map.current.hasImage(aanbieder.system_id + ':0')) {
        // console.log("image already exists");
        return;
      }
      var value = await getVehicleMarkers(aanbieder.color);
      value.forEach((img, idx) => {
        map.current.addImage(aanbieder.system_id + ":" + idx, { width: 25, height: 25, data: img});
      });
    };
    providers.forEach(aanbieder => {
      addProviderImage(aanbieder);
    });
  }, [providers]);

  return null;
}

export {
  MapComponent
};
