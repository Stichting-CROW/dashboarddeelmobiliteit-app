import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { MapComponentUnified as MapComponent } from '../components/Map/MapComponentUnified';
import { SelectLayer } from '../components/SelectLayer/SelectLayer.jsx';
import { MetaStats } from '../components/MetaStats/MetaStats.jsx';
import { HubStatsWidget } from '../components/HubStatsWidget/HubStatsWidget';
import { useLayerManager } from '../hooks/useLayerManager';
import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_POLICY_HUBS,
  DISPLAYMODE_START,
} from '../reducers/layers.js';

import { StateType } from '../types/StateType';

import './MapPage.css';

interface MapPageProps {
  mapContainer: React.RefObject<HTMLDivElement>;
}

function MapPage({ mapContainer }: MapPageProps) {
  const { getCurrentDisplayMode } = useLayerManager();
  const location = useLocation();

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  // Extract zone_id from URL for zones page
  const getZoneIdFromUrl = () => {
    if (displayMode === DISPLAYMODE_ZONES_PUBLIC) {
      // Extract geography_id from URL path like /map/zones/{geography_id}
      const pathParts = location.pathname.split('/');
      const geographyId = pathParts[pathParts.length - 1];
      
      // If it's not a valid geography_id (e.g., just "zones"), return null
      if (geographyId && geographyId !== 'zones') {
        // For now, we'll use the geography_id as zone_id
        // In a real implementation, you might need to map geography_id to zone_id
        return geographyId;
      }
    }
    return null;
  };

  const zoneId = getZoneIdFromUrl();

  return (
    <div className="flex flex-col">
      <div className="hidden sm:block">
        {(displayMode !== DISPLAYMODE_START) && <SelectLayer />}
        {(displayMode === DISPLAYMODE_PARK || displayMode === DISPLAYMODE_RENTALS) && <MetaStats />}
        {(displayMode === DISPLAYMODE_ZONES_PUBLIC) && zoneId && <HubStatsWidget zone_id={zoneId} />}
      </div>
      <div className="flex-1 bg-red-400">
        <MapComponent
          mapContainer={mapContainer}
        />
      </div>
    </div>
  );
}

export default MapPage; 