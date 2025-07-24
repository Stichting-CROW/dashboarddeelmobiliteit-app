import React from 'react';
import { useLayerManager } from '../hooks/useLayerManager';

/**
 * Example component demonstrating the new layer management system.
 * This shows how to use the useLayerManager hook in a real component.
 */
const LayerManagerExample: React.FC = () => {
  const {
    currentState,
    allLayers,
    allPresets,
    getLayersByCategory,
    getPresetsByCategory,
    isLayerVisible,
    isPresetActive,
    getCurrentDisplayMode,
    setBaseLayer,
    toggleZones,
    setParkView,
    setRentalsView
  } = useLayerManager();

  const currentDisplayMode = getCurrentDisplayMode();

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Layer Manager Example</h2>
      
      {/* Current State Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current State</h3>
        <div className="bg-gray-100 p-3 rounded">
          <p><strong>Base Layer:</strong> {currentState.baseLayer}</p>
          <p><strong>Zones Visible:</strong> {currentState.zonesVisible ? 'Yes' : 'No'}</p>
          <p><strong>Active Preset:</strong> {currentState.activePreset || 'None'}</p>
          <p><strong>Display Mode:</strong> {currentDisplayMode}</p>
          <p><strong>Visible Layers:</strong> {currentState.visibleLayers.join(', ')}</p>
        </div>
      </div>

      {/* Base Layer Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Base Layer Controls</h3>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${currentState.baseLayer === 'base' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setBaseLayer('base')}
          >
            Standard
          </button>
          <button
            className={`px-3 py-1 rounded ${currentState.baseLayer === 'satellite' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setBaseLayer('satellite')}
          >
            Satellite
          </button>
          <button
            className={`px-3 py-1 rounded ${currentState.baseLayer === 'hybrid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setBaseLayer('hybrid')}
          >
            Hybrid
          </button>
        </div>
      </div>

      {/* Zones Toggle */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Zones Control</h3>
        <button
          className={`px-3 py-1 rounded ${currentState.zonesVisible ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          onClick={toggleZones}
        >
          {currentState.zonesVisible ? 'Hide' : 'Show'} Zones
        </button>
      </div>

      {/* Data Layer Controls (Park Mode) */}
      {currentDisplayMode === 'displaymode-park' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Park Mode Data Layers</h3>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded ${isPresetActive('park-points') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setParkView('parkeerdata-voertuigen')}
            >
              Points
            </button>
            <button
              className={`px-3 py-1 rounded ${isPresetActive('park-clusters') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setParkView('parkeerdata-clusters')}
            >
              Clusters
            </button>
            <button
              className={`px-3 py-1 rounded ${isPresetActive('park-heatmap') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setParkView('parkeerdata-heatmap')}
            >
              Heatmap
            </button>
          </div>
        </div>
      )}

      {/* Data Layer Controls (Rentals Mode) */}
      {currentDisplayMode === 'displaymode-rentals' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Rentals Mode Data Layers</h3>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded ${isPresetActive('rentals-origins-points') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRentalsView('verhuurdata-voertuigen')}
            >
              Origins Points
            </button>
            <button
              className={`px-3 py-1 rounded ${isPresetActive('rentals-origins-clusters') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRentalsView('verhuurdata-clusters')}
            >
              Origins Clusters
            </button>
            <button
              className={`px-3 py-1 rounded ${isPresetActive('rentals-origins-heatmap') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setRentalsView('verhuurdata-heatmap')}
            >
              Origins Heatmap
            </button>
          </div>
        </div>
      )}

      {/* Available Layers List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Available Layers</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.values(allLayers).map(layer => (
            <div
              key={layer.id}
              className={`p-2 rounded border ${isLayerVisible(layer.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <p className="font-medium">{layer.name}</p>
              <p className="text-sm text-gray-600">{layer.description}</p>
              <p className="text-xs text-gray-500">Category: {layer.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Available Presets List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Available Presets</h3>
        <div className="grid grid-cols-2 gap-4">
          {allPresets.map(preset => (
            <div
              key={preset.id}
              className={`p-2 rounded border ${isPresetActive(preset.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <p className="font-medium">{preset.name}</p>
              <p className="text-sm text-gray-600">{preset.description}</p>
              <p className="text-xs text-gray-500">Category: {preset.category}</p>
              <p className="text-xs text-gray-500">Layers: {preset.layers.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayerManagerExample; 