import React, { useState } from 'react';
import { useLayerManager } from '../../hooks/useLayerManager';
import { LayerConfig, LayerPreset } from '../../types/LayerTypes';
import Modal from '../Modal/Modal';
import './SelectLayer.css';

interface SelectLayerNewProps {
  isVisible: boolean;
  onClose: () => void;
}

const SelectLayerNew: React.FC<SelectLayerNewProps> = ({ isVisible, onClose }) => {
  const {
    currentState,
    allLayers,
    allPresets,
    getLayersByCategory,
    getPresetsByCategory,
    isLayerVisible,
    isPresetActive,
    getCurrentDisplayMode,
    getCurrentParkView,
    getCurrentRentalsView,
    setBaseLayer,
    toggleZones,
    setParkView,
    setRentalsView
  } = useLayerManager();

  const [activeTab, setActiveTab] = useState<'base' | 'data'>('base');

  const currentDisplayMode = getCurrentDisplayMode();
  const currentParkView = getCurrentParkView();
  const currentRentalsView = getCurrentRentalsView();

  // Get base layers
  const baseLayers = getLayersByCategory('base').concat(
    getLayersByCategory('satellite'),
    getLayersByCategory('hybrid')
  );

  // Get data layers based on current display mode
  const getDataLayers = () => {
    if (currentDisplayMode === 'displaymode-park') {
      return getPresetsByCategory('park');
    } else if (currentDisplayMode === 'displaymode-rentals') {
      return getPresetsByCategory('rentals');
    } else if (currentDisplayMode === 'displaymode-zones-public') {
      return getPresetsByCategory('zones');
    } else if (currentDisplayMode === 'displaymode-policy-hubs') {
      return getPresetsByCategory('policy-hubs');
    }
    return [];
  };

  const dataLayers = getDataLayers();

  const handleBaseLayerClick = (layerId: string) => {
    setBaseLayer(layerId as 'base' | 'satellite' | 'hybrid');
  };

  const handleDataLayerClick = (preset: LayerPreset) => {
    if (currentDisplayMode === 'displaymode-park') {
      // Map preset to view mode
      const viewModeMap: Record<string, string> = {
        'park-points': 'parkeerdata-voertuigen',
        'park-clusters': 'parkeerdata-clusters',
        'park-heatmap': 'parkeerdata-heatmap'
      };
      const viewMode = viewModeMap[preset.id];
      if (viewMode) {
        setParkView(viewMode);
      }
    } else if (currentDisplayMode === 'displaymode-rentals') {
      // Map preset to view mode
      const viewModeMap: Record<string, string> = {
        'rentals-origins-points': 'verhuurdata-voertuigen',
        'rentals-origins-clusters': 'verhuurdata-clusters',
        'rentals-origins-heatmap': 'verhuurdata-heatmap',
        'rentals-destinations-points': 'verhuurdata-voertuigen',
        'rentals-destinations-clusters': 'verhuurdata-clusters',
        'rentals-destinations-heatmap': 'verhuurdata-heatmap'
      };
      const viewMode = viewModeMap[preset.id];
      if (viewMode) {
        setRentalsView(viewMode);
      }
    }
  };

  const renderBaseLayer = (layer: LayerConfig) => {
    const isActive = currentState.baseLayer === layer.id;
    return (
      <div
        key={layer.id}
        data-type={`map-style-${layer.id}`}
        className={`layer${!isActive ? ' layer-inactive' : ''}`}
        onClick={() => handleBaseLayerClick(layer.id)}
      >
        <span className="layer-title">{layer.name}</span>
        {layer.description && (
          <span className="layer-description">{layer.description}</span>
        )}
      </div>
    );
  };

  const renderDataLayer = (preset: LayerPreset) => {
    const isActive = isPresetActive(preset.id);
    return (
      <div
        key={preset.id}
        data-type={preset.id}
        className={`layer${!isActive ? ' layer-inactive' : ''}`}
        onClick={() => handleDataLayerClick(preset)}
      >
        <span className="layer-title">{preset.name}</span>
        <span className="layer-description">{preset.description}</span>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      isVisible={isVisible}
      title="Wijzig lagen"
      button2Title="Sluiten"
      button2Handler={(e) => {
        e.preventDefault();
        onClose();
      }}
      hideModalHandler={onClose}
      config={{}}
    >
      <div className="SelectLayer">
        {/* Tab Navigation */}
        <div className="layer-tabs">
          <button
            className={`tab-button ${activeTab === 'base' ? 'active' : ''}`}
            onClick={() => setActiveTab('base')}
          >
            Basislaag
          </button>
          <button
            className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Datalaag
          </button>
        </div>

        {/* Base Layer Tab */}
        {activeTab === 'base' && (
          <div className="tab-content">
            <h2>Basislaag</h2>
            {baseLayers.map(renderBaseLayer)}
            
            {/* Zones toggle (only for logged-in users) */}
            {currentState.zonesVisible !== undefined && (
              <>
                <div className="layer-separator" />
                <div
                  data-type="zones"
                  className={`layer${!currentState.zonesVisible ? ' layer-inactive' : ''}`}
                  onClick={toggleZones}
                >
                  <span className="layer-title">CBS-gebied</span>
                  <span className="layer-description">CBS-gebiedsgrenzen tonen</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Data Layer Tab */}
        {activeTab === 'data' && (
          <div className="tab-content">
            <h2>Datalaag</h2>
            {dataLayers.map(renderDataLayer)}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SelectLayerNew; 