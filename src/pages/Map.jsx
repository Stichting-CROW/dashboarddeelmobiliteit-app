import React, { useRef, useEffect, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector, useDispatch } from 'react-redux';
import maplibregl from 'maplibre-gl';

import {
  getVehicles
} from '../selectors.js'

import { setVehicles } from '../actions/vehicles.js'

import './Map.css';

function Map(props) {
  const dispatch = useDispatch()

  //Get the value of a State variable, and store it to a const, to use it later
  const vehicles = useSelector(state => {
    return state.vehicles ? state.vehicles.data : []
  });

  console.log('vehicles', vehicles)

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(5.102406);
  const [lat] = useState(52.0729252);
  const [zoom] = useState(14);

  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  useEffect(() => {
    if (map.current) return; //stops map from intializing more than once
    // Init MapLibre map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=oYg5wHevXnoE2PBNr3iN',
      center: [lng, lat],
      zoom: zoom
    });
    // Add controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    new maplibregl.Marker({color: "#FF0000"})
      .setLngLat([lng,lat])
      .addTo(map.current);
  });

  return <div className="Map">
    <div onClick={() => {
      dispatch({
        type: 'SET_VEHICLES',
        payload: 'test'
      })
    }}>TEST</div>
    <div ref={mapContainer} className="map" />
  </div>
}

export default Map;
