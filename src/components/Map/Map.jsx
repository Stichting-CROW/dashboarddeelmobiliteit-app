import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';

import './Map.css';

import {layers} from './layers';

function Map(props) {
  //Get the value of a State variable, and store it to a const, to use it later
  const vehicles = useSelector(state => {
    return state.vehicles ? state.vehicles.data : null;
  });

  const mapContainer = useRef(null);
  const [lng] = useState(5.102406);
  const [lat] = useState(52.0729252);
  const [zoom] = useState(14);
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
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.on('load', function() {
        setCounter(counter + 1)
      })
    }
    initMap();
  }, [vehicles, lng, lat, zoom, counter])

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
        // console.log('source does not exist. setting vehicles', vehicles)
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

      const doesLayerExist = map.current.getLayer('vehicles-heatmap');
      if(doesLayerExist) return;

      // Add layers to the map
      props.layers.map(x => {
        if(props.layers.indexOf(x) >= -1) {
          map.current.addLayer(layers[x]);
        }
      })
    }
    addLayers(vehicles);
  }, [vehicles, counter]);

  return <div className="Map">
    <div ref={mapContainer} className="map" />
  </div>
}

export {Map};
