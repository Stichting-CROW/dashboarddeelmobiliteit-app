import { useLayerManager } from '../../hooks/useLayerManager';
import { useSelector } from "react-redux";
import { StateType } from "@/src/types/StateType";

const SelectLayerModal = () => {
  const {
    currentState,
    getLayersByCategory,
    getPresetsByCategory,
    isPresetActive,
    setBaseLayer,
    setParkView,
    setRentalsView,
    toggleZones,
    getCurrentDisplayMode,
    getCurrentParkView,
    getCurrentRentalsView
  } = useLayerManager();

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
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

  // Helper function to get base layer name
  const getBaseLayerName = (layerId: string) => {
    const layer = baseLayers.find(l => l.id === layerId) || 
                  satelliteLayers.find(l => l.id === layerId) || 
                  hybridLayers.find(l => l.id === layerId);
    return layer?.name || layerId;
  };

  // Helper function to get base layer style
  const getBaseLayerStyle = (layerId: string) => {
    switch (layerId) {
      case 'base': return 'base';
      case 'satellite': return 'luchtfoto-pdok';
      case 'hybrid': return 'hybrid';
      default: return layerId;
    }
  };

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
        className={`layer${currentState.baseLayer !== 'base' ? ' layer-inactive' : ''}`} 
        onClick={() => setBaseLayer('base')}
      >
        <span className="layer-title">
          Standaard
        </span>
      </div>
      
      <div 
        data-type="map-style-satellite" 
        className={`layer${currentState.baseLayer !== 'satellite' ? ' layer-inactive' : ''}`} 
        onClick={() => setBaseLayer('satellite')}
      >
        <span className="layer-title">
          Luchtfoto
        </span>
      </div>
      
      <div 
        data-type="map-style-hybrid" 
        className={`layer${currentState.baseLayer !== 'hybrid' ? ' layer-inactive' : ''}`} 
        onClick={() => setBaseLayer('hybrid')}
      >
        <span className="layer-title">
          Hybride
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
          onClick={toggleZones}
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
