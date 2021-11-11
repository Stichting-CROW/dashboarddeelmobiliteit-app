import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';

import './Map.css';

import {layers} from './layers';
import {sources} from './sources.js';

const md5 = require('md5');

function Map(props) {

  // Get vehicles from store
  const vehicles = useSelector(state => {
    return state.vehicles || null;
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
      if (map.current) return;
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
        center: [lng, lat],
        zoom: zoom
      });
      // Add controls
      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  
      map.current.on('load', function() {
        setCounter(counter + 1)
      })
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
    let hash = sourceData.data && sourceData.data.features ? md5(sourceData.data.features) : md5('No data yet');
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
    } else {
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
  }, [
    vehicles ? (vehicles.data ? vehicles.data.features : vehicles.data) : vehicles,
    zones_geodata,
    zonesGeodataHash,
    counter,
    props.activeSource
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
  }, [vehicles, zones_geodata, counter, props.layers]);

  return null;
}

export {
  Map
};
