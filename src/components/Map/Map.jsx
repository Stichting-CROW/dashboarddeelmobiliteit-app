import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';

import './Map.css';

import {layers} from './layers';
import {sources} from './sources.js';

const md5 = require('md5');

function Map(props) {
  //Get the value of a State variable, and store it to a const, to use it later
  const vehicles = useSelector(state => {
    return state.vehicles ? state.vehicles.data : null;
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
  let map = useRef(null);

  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  useEffect(() => {
    // Init MapLibre map
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

  useEffect(() => {
    const addDataSources = (vehicles, zones_geodata) => {
      if (! map.current || ! map.current.isStyleLoaded()) {
        // Refresh state, so that addDataSources runs again
        setTimeout(() => {
          setCounter(counter + 1)
        }, 250)
        return;
      }
      if (! vehicles) {
        return;
      }

      // Check if source exists
      const doesSourceExist = map.current.getSource(props.activeSource);

      if(doesSourceExist) {
        // Source does exist. Do nothing
      } else {
        console.log('Add source', props.activeSource)
        let source = Object.assign({}, {
          'type': 'geojson',
          'data': vehicles,
        }, sources[props.activeSource] ? sources[props.activeSource] : {});
        map.current.addSource(props.activeSource, source);
      }

      // Check if source exists
      const doesSourceExistGeodata = map.current.getSource('zones-geodata');
      let hash = md5(zones_geodata)
      if(doesSourceExistGeodata) {
        if(zonesGeodataHash!==hash) {
          // console.log("Update source zones-geodata %o", zones_geodata)
          setZonesGeodataHash(hash);
          map.current.getSource('zones-geodata').setData(zones_geodata.data);
        } else {
          // console.log("Skip update source zones-geodata %o", zonesGeodataHash, hash)
        }
      } else {
        // console.log("Add source zones-geodata %o", zones_geodata)
        if(zones_geodata.data) {
          setZonesGeodataHash(md5(zones_geodata));
          map.current.addSource('zones-geodata', {
            'type': 'geojson',
            'data': zones_geodata.data
          });
        }
      }
    }
    addDataSources(vehicles, zones_geodata);
    
  }, [
    vehicles,
    zones_geodata,
    zonesGeodataHash,
    counter,
    props.activeSource
  ])

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

  return (null)
}

export {
  Map
};
