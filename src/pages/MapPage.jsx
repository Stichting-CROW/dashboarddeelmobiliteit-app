import React from 'react';
import { useSelector } from 'react-redux';
import {MapComponent} from '../components/Map/MapComponent.jsx';
import {SelectLayer} from '../components/SelectLayer/SelectLayer.jsx';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA
} from '../reducers/layers.js';

import './MapPage.css';

function Map({mode, mapContainer}) {
  const showZones = useSelector(state => {
    return state.layers ? state.layers.zones_visible : false;
  });

  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const viewPark = useSelector(state => {
    return state.layers ? state.layers.view_park : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });

  const viewRentals = useSelector(state => {
    return state.layers ? state.layers.view_rentals : DISPLAYMODE_VERHUURDATA;
  });
  
  let layers = [];
  if(showZones) { layers.push('zones-geodata') }
  
  let activesource = '';
  if(displayMode===DISPLAYMODE_PARK) {
    switch(viewPark) {
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
  } else if(displayMode===DISPLAYMODE_RENTALS) {
    switch(viewRentals) {
      case DISPLAYMODE_VERHUURDATA:
        layers.push('rentals-point');
        activesource = 'rentals';
        break;
      default:
    }
  }
  return (
    <div className="flex flex-col">
      <div className="hidden sm:block">
        <SelectLayer />
      </div>
      <div className="flex-1 bg-red-400">
        <MapComponent
          mapContainer={mapContainer}
          layers={layers}
          activeSource={activesource}
        />
      </div>
  </div>);
}

export default Map;
