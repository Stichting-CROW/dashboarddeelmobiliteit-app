import React from 'react';
import { useSelector } from 'react-redux';
import {MapComponent} from '../components/Map/MapComponent.jsx';
import {SelectLayer} from '../components/SelectLayer/SelectLayer.jsx';
import {MetaStats} from '../components/MetaStats/MetaStats.jsx';
import {HubStatsWidget} from '../components/HubStatsWidget/HubStatsWidget';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_CLUSTERS,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
} from '../reducers/layers.js';

import './MapPage.css';

function Map({mode, mapContainer}) {
  const showZones = useSelector(state => {
    return state.layers ? state.layers.zones_visible : false;
  });

  const filter = useSelector(state => {
    return state.filter;
  });

  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const viewPark = useSelector(state => {
    return state.layers ? state.layers.view_park : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });

  const viewRentals = useSelector(state => {
    return state.layers ? state.layers.view_rentals : DISPLAYMODE_VERHUURDATA_VOERTUIGEN;
  });
  
  let layers = [], activeSources = [];
  if(showZones) {
    layers.push('zones-geodata', 'zones-geodata-border')
  }

  layers.push('zones-isochrones');
  
  // Active layers for vehicles page
  if(displayMode===DISPLAYMODE_PARK && viewPark) {
    switch(viewPark) {
      case DISPLAYMODE_PARKEERDATA_HEATMAP:
        layers.push('vehicles-heatmap');
        activeSources.push('vehicles');
        break;
      case DISPLAYMODE_PARKEERDATA_CLUSTERS:
        layers.push('vehicles-clusters');
        layers.push('vehicles-clusters-count');
        layers.push('vehicles-clusters-point');
        activeSources.push('vehicles');
        activeSources.push('vehicles-clusters');
        break;
      case DISPLAYMODE_PARKEERDATA_VOERTUIGEN:
        layers.push('vehicles-point');
        activeSources.push('vehicles');
        break;
      default:
    }
  }
  // Active layers for rentals page
  else if(displayMode===DISPLAYMODE_RENTALS && viewRentals) {
    const rentalsKey = (filter.herkomstbestemming === 'bestemming' ? 'destinations' : 'origins');
    switch(viewRentals) {
      case DISPLAYMODE_VERHUURDATA_HEATMAP:
        layers.push(`rentals-${rentalsKey}-heatmap`);
        activeSources.push(`rentals-${rentalsKey}`);
        break;
      case DISPLAYMODE_VERHUURDATA_CLUSTERS:
        layers.push(`rentals-${rentalsKey}-clusters`);
        layers.push(`rentals-${rentalsKey}-clusters-count`);
        layers.push(`rentals-${rentalsKey}-clusters-point`);
        activeSources.push(`rentals-${rentalsKey}-clusters`);
        break;
      case DISPLAYMODE_VERHUURDATA_VOERTUIGEN:
        layers.push(`rentals-${rentalsKey}-point`);
        activeSources.push(`rentals-${rentalsKey}`);
        break;
    }
  }
  // Active layers for zones page
  else if(displayMode===DISPLAYMODE_ZONES_PUBLIC) {
    layers.push('zones-metrics-public');
    layers.push('zones-metrics-public-border');
    activeSources.push('zones-metrics-public');
  }

  // console.log('layers', layers)
  // console.log('activeSources', activeSources)

  return (
    <div className="flex flex-col">
      <div className="hidden sm:block">
        <SelectLayer />
        {(displayMode === DISPLAYMODE_PARK || displayMode === DISPLAYMODE_RENTALS) && <MetaStats />}
        {(displayMode === DISPLAYMODE_ZONES_PUBLIC) && <HubStatsWidget />}
      </div>
      <div className="flex-1 bg-red-400">
        <MapComponent
          mapContainer={mapContainer}
          layers={layers}
          activeSources={activeSources}
        />
      </div>
  </div>);
}

export default Map;
