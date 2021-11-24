import React, {useState} from 'react';
import { useSelector } from 'react-redux';
import {Map as MapComponent} from '../components/Map/Map.jsx';
import {SelectLayer} from '../components/SelectLayer/SelectLayer.jsx';
import {
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN } from '../reducers/layers.js';

import './Map.css';

function Map(props) {
  const showZones = useSelector(state => {
    return state.layers ? state.layers.zones_visible : false;
  });

  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });
  
  let layers = [];
  if(showZones) { layers.push('zones-geodata') }
  
  let activesource = '';
  switch(displayMode) {
    case DISPLAYMODE_PARKEERDATA_HEATMAP:
      layers.push('vehicles-heatmap-city-level');
      activesource = 'vehicles';
      break;
    case DISPLAYMODE_PARKEERDATA_CLUSTERS:
      layers.push('vehicles-clusters');
      layers.push('vehicles-clusters-count');
      layers.push('vehicles-clusters-point');
      activesource = 'vehicles-clusters';
      break;
    case DISPLAYMODE_PARKEERDATA_VOERTUIGEN:
      layers.push('vehicles-point');
      activesource = 'vehicles';
      break;
    default:
  }
  
  return (
    <div className="flex flex-col">
      <SelectLayer
        layers={layers}
      />
      <div className="flex-1 bg-red-400">
        <MapComponent
          mapContainer={props.mapContainer}
          layers={layers}
          activeSource={activesource}
        />
      </div>
  </div>);
}

export default Map;
