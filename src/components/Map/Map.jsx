import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';

import './Map.css';

import {layers} from './layers';
// import {sources} from './sources.js';

function Map(props) {
  //Get the value of a State variable, and store it to a const, to use it later
  const vehicles = useSelector(state => {
    return state.vehicles ? state.vehicles.data : null;
  });

  const mapContainer = props.mapContainer;
  const [lng] = useState(4.4671854);
  const [lat] = useState(51.9250836);
  const [zoom] = useState(15);
  const [counter, setCounter] = useState(0);
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
  }, [vehicles, lng, lat, zoom, counter, mapContainer])

  useEffect(() => {
    const addDataSources = (vehicles) => {
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
      const doesSourceExist = map.current.getSource('vehicles');
      if(doesSourceExist) {
        // console.log('source does exist. setting vehicles', vehicles)
        // map.current.getSource('vehicles').setData(vehicles);
      } else {
        map.current.addSource('vehicles', {
          'type': 'geojson',
          'data': vehicles
        });
      }
    }
    addDataSources(vehicles);
  }, [vehicles, counter])

  useEffect(() => {
    const addLayers = (vehicles) => {
      if (! map.current || ! map.current.isStyleLoaded()) {
        setTimeout(() => {
          setCounter(counter + 1)
        }, 250)
        return;
      }
      if (! vehicles) return;

      // Remove 'old' layers
      const allLayers = map.current.getStyle().layers;
      allLayers.forEach(x => {
        // Check if this is one of our layers
        if(x.id.indexOf('vehicles-') > -1) {
          // If so, remove
          map.current.removeLayer(x.id)
        }
      })
      // Add selected layers to the map
      props.layers.forEach(x => {
        if(props.layers.indexOf(x) >= -1) {
          const doesLayerExist = map.current.getLayer(x);
          if(! doesLayerExist) map.current.addLayer(layers[x]);
        }
      })
    }
    addLayers(vehicles);
  }, [vehicles, counter, props.layers]);

  return (null)
}

export {Map};
