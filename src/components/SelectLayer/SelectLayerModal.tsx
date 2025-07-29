import { useLayerManager } from '../../hooks/useLayerManager';
import { useUnifiedLayerManager } from '../../hooks/useUnifiedLayerManager';
import { useSelector } from "react-redux";
import { StateType } from "@/src/types/StateType";
import { useEffect } from "react";

// Simple performance tracking
const trackPerformance = (layerType: string, startTime: number) => {
  const endTime = performance.now();
  const switchTime = endTime - startTime;
  console.log(`⚡ Layer switch: ${layerType} took ${switchTime.toFixed(1)}ms`);
  
  // Show performance indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${switchTime < 100 ? '#4CAF50' : switchTime < 300 ? '#FF9800' : '#F44336'};
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    z-index: 10000;
    pointer-events: none;
  `;
  indicator.textContent = `${switchTime.toFixed(1)}ms`;
  document.body.appendChild(indicator);
  
  setTimeout(() => {
    document.body.removeChild(indicator);
  }, 2000);
};

const SelectLayerModal = () => {
  // Use the ultra-fast layer switching hook for base layers
  const layerManager = useUnifiedLayerManager();
  const {
    setBaseLayer: setBaseLayerFast,
    toggleZones: toggleZonesFast,
    currentState: unifiedCurrentState,
    isSwitching
  } = layerManager;
  
  // Expose unified layer manager globally for other components to use
  useEffect(() => {
    (window as any).__UNIFIED_LAYER_MANAGER__ = layerManager;
    
    return () => {
      delete (window as any).__UNIFIED_LAYER_MANAGER__;
    };
  }, [layerManager]);
  
  const currentMapStyle = unifiedCurrentState.baseLayer;
  const isLoggedIn = useSelector((state: StateType) => state.authentication.user_data ? true : false);

  // Use the regular layer manager for data layers
  const {
    currentState,
    getLayersByCategory,
    getPresetsByCategory,
    isPresetActive,
    setParkView,
    setRentalsView,
    getCurrentDisplayMode,
    getCurrentParkView,
    getCurrentRentalsView
  } = useLayerManager();

  // Add debugging for zones data
  const zones_geodata = useSelector((state: StateType) => {
    return state.zones_geodata;
  });

  const displayMode = getCurrentDisplayMode();
  const viewPark = getCurrentParkView();
  const viewRentals = getCurrentRentalsView();

  // Get base layers
  const baseLayers = getLayersByCategory('base');
  const satelliteLayers = getLayersByCategory('satellite');
  const hybridLayers = getLayersByCategory('hybrid');

  // Get data layer presets
  const parkPresets = getPresetsByCategory('park');
  const rentalsPresets = getPresetsByCategory('rentals');

  // Helper function to get park view mode
  const getParkViewMode = (presetId: string) => {
    switch (presetId) {
      case 'park-points': return 'parkeerdata-voertuigen';
      case 'park-clusters': return 'parkeerdata-clusters';
      case 'park-heatmap': return 'parkeerdata-heatmap';
      default: return 'parkeerdata-voertuigen';
    }
  };

  // Helper function to get rentals view mode
  const getRentalsViewMode = (presetId: string) => {
    switch (presetId) {
      case 'rentals-origins-points': return 'verhuurdata-voertuigen';
      case 'rentals-origins-clusters': return 'verhuurdata-clusters';
      case 'rentals-origins-heatmap': return 'verhuurdata-heatmap';
      case 'rentals-destinations-points': return 'verhuurdata-voertuigen';
      case 'rentals-destinations-clusters': return 'verhuurdata-clusters';
      case 'rentals-destinations-heatmap': return 'verhuurdata-heatmap';
      default: return 'verhuurdata-voertuigen';
    }
  };

  return (
    <div className="SelectLayer">
      <h2>Basislaag</h2>

      {/* Base layer options */}
      <div 
        data-type="map-style-default" 
        className={`layer${currentMapStyle !== 'base' ? ' layer-inactive' : ''}`} 
        onClick={() => setBaseLayerFast('base')}
        style={{ opacity: isSwitching ? 0.7 : 1, cursor: isSwitching ? 'wait' : 'pointer' }}
      >
        <span className="layer-title">
          Standaard
        </span>
      </div>
      
      <div 
        data-type="map-style-satellite" 
        className={`layer${currentMapStyle !== 'hybrid' ? ' layer-inactive' : ''}`} 
        onClick={() => setBaseLayerFast('hybrid')}
        style={{ opacity: isSwitching ? 0.7 : 1, cursor: isSwitching ? 'wait' : 'pointer' }}
      >
        <span className="layer-title">
          Luchtfoto
        </span>
      </div>
      
      {/* Separator for logged-in users */}
      {isLoggedIn && (
        <div
          className={`layer${!currentState.zonesVisible ? ' layer-inactive' : ''}`}
          style={{width: '1px', borderColor: '#eee'}}
        />
      )}

      {/* Zones layer for logged-in users */}
      {isLoggedIn && (
        <div 
          data-type="zones" 
          className={`layer${!currentState.zonesVisible ? ' layer-inactive' : ''}`} 
          style={{ opacity: isSwitching ? 0.7 : 1, cursor: isSwitching ? 'wait' : 'pointer' }}
        >
          <span className="layer-title">
            CBS-gebied
          </span>
        </div>
      )}

      <h2>Datalaag</h2>

      {/* Park mode data layers */}
      {displayMode === 'displaymode-park' && parkPresets.map(preset => (
        <div
          key={preset.id}
          data-type={preset.id.includes('heatmap') ? 'heat-map' : preset.id.includes('clusters') ? 'pointers' : 'vehicles'}
          className={`layer${!isPresetActive(preset.id) ? ' layer-inactive' : ''}`}
          onClick={() => setParkView(getParkViewMode(preset.id))}
        >
          <span className="layer-title">
            {preset.name}
          </span>
        </div>
      ))}

      {/* Rentals mode data layers */}
      {displayMode === 'displaymode-rentals' && rentalsPresets.map(preset => (
        <div
          key={preset.id}
          data-type={preset.id.includes('heatmap') ? 'heat-map' : preset.id.includes('clusters') ? 'pointers' : 'vehicles'}
          className={`layer${!isPresetActive(preset.id) ? ' layer-inactive' : ''}`}
          onClick={() => setRentalsView(getRentalsViewMode(preset.id))}
        >
          <span className="layer-title">
            {preset.name}
          </span>
        </div>
      ))}

      {/* Zones public mode (currently disabled) */}
      {displayMode === 'displaymode-zones-public' && false && (
        <>
          <div
            data-type="monitoring"
            className="layer"
            onClick={() => setParkView('parkeerdata-heatmap')}
          >
            <span className="layer-title">
              Analyse
            </span>
          </div>

          <div
            data-type="parking"
            className="layer"
            onClick={() => setParkView('parkeerdata-heatmap')}
          >
            <span className="layer-title">
              Parking
            </span>
          </div>

          <div
            data-type="no parking"
            className="layer"
            onClick={() => setParkView('parkeerdata-heatmap')}
          >
            <span className="layer-title">
              No parking
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectLayerModal;
