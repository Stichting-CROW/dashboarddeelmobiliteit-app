import React, { useState } from 'react';
import { useUnifiedLayerManager } from '../hooks/useUnifiedLayerManager';

/**
 * Example component demonstrating the unified layer management system.
 * This shows how to use the useUnifiedLayerManager hook for all layer operations.
 */
const UnifiedLayerManagerExample: React.FC = () => {
  const [selectedBaseLayer, setSelectedBaseLayer] = useState<'base' | 'satellite' | 'hybrid'>('base');
  const [useUltraFast, setUseUltraFast] = useState(false);
  
  const layerManager = useUnifiedLayerManager();

  const currentDisplayMode = layerManager.getCurrentDisplayMode();
  const currentState = layerManager.currentState;

  // Handle base layer change
  const handleBaseLayerChange = (baseLayer: 'base' | 'satellite' | 'hybrid') => {
    setSelectedBaseLayer(baseLayer);
    // Use the unified layer manager's setBaseLayer method
    (layerManager as any).setBaseLayer(baseLayer, {
      useUltraFast,
      skipAnimation: true,
      batch: true
    });
  };

  // Handle zones toggle
  const handleZonesToggle = () => {
    // Use the unified layer manager's toggleZones method
    (layerManager as any).toggleZones({
      useUltraFast,
      skipAnimation: true
    });
  };

  // Handle individual layer visibility
  const handleLayerVisibility = (layerId: string, visible: boolean) => {
    layerManager.setLayerVisibility(layerId, visible, {
      useUltraFast,
      skipAnimation: true
    });
  };

  // Handle batch layer operations
  const handleBatchLayerOperation = () => {
    const operations = [
      { layerId: 'vehicles-point', visible: true },
      { layerId: 'vehicles-clusters', visible: false },
      { layerId: 'vehicles-heatmap', visible: false }
    ];
    
    layerManager.batchSetLayerVisibility(operations, {
      useUltraFast,
      skipAnimation: true
    });
  };

  // Handle layer activation (replaces old activateLayers function)
  const handleLayerActivation = () => {
    const activeLayers = ['vehicles-point', 'zones-geodata'];
    layerManager.activateLayers(activeLayers, {
      useUltraFast: false, // Use traditional mode for bulk operations
      skipAnimation: false,
      preserveExisting: false
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Unified Layer Manager Example</h2>
      
      {/* Performance Mode Toggle */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-2">Performance Mode</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useUltraFast}
            onChange={(e) => setUseUltraFast(e.target.checked)}
            className="rounded"
          />
          <span>Use Ultra-Fast Mode</span>
        </label>
        <p className="text-sm text-gray-600 mt-1">
          Ultra-fast mode disables map interactions during layer changes for better performance.
        </p>
      </div>

      {/* Current State Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current State</h3>
        <div className="bg-gray-100 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Base Layer:</strong> {currentState.baseLayer}</p>
              <p><strong>Zones Visible:</strong> {currentState.zonesVisible ? 'Yes' : 'No'}</p>
              <p><strong>Display Mode:</strong> {currentDisplayMode}</p>
            </div>
            <div>
              <p><strong>Active Preset:</strong> None (not available in current state)</p>
              <p><strong>Visible Layers:</strong> {currentState.visibleLayers.length}</p>
              <p><strong>Is Switching:</strong> {layerManager.isSwitching ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Base Layer Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Base Layer Controls</h3>
        <div className="flex space-x-2">
          {(['base', 'satellite', 'hybrid'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => handleBaseLayerChange(layer)}
              className={`px-4 py-2 rounded ${
                selectedBaseLayer === layer
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Zones Toggle */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Zones Toggle</h3>
        <button
          onClick={handleZonesToggle}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Toggle Zones ({currentState.zonesVisible ? 'Hide' : 'Show'})
        </button>
      </div>

      {/* Individual Layer Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Individual Layer Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          {['vehicles-point', 'vehicles-clusters', 'vehicles-heatmap'].map((layerId) => {
            const isVisible = layerManager.getLayerVisibility(layerId);
            return (
              <div key={layerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{layerId}</span>
                <button
                  onClick={() => handleLayerVisibility(layerId, !isVisible)}
                  className={`px-3 py-1 rounded text-sm ${
                    isVisible
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Operations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Batch Operations</h3>
        <div className="space-y-2">
          <button
            onClick={handleBatchLayerOperation}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Batch: Show Points, Hide Clusters & Heatmap
          </button>
          <button
            onClick={handleLayerActivation}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Activate: Points + Zones (Traditional Mode)
          </button>
        </div>
      </div>

      {/* Layer Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Layer Information</h3>
        <div className="bg-gray-100 p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            {['vehicles-point', 'vehicles-clusters', 'zones-geodata'].map((layerId) => {
              const exists = layerManager.layerExists(layerId);
              const visibility = layerManager.getLayerVisibility(layerId);
              return (
                <div key={layerId} className="text-sm">
                  <p><strong>{layerId}:</strong></p>
                  <p>Exists: {exists ? 'Yes' : 'No'}</p>
                  <p>Visible: {visibility ? 'Yes' : 'No'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Available Layers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Available Layers</h3>
        <div className="bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-sm">
            {Object.keys(layerManager.allLayers).map((layerId) => (
              <div key={layerId} className="p-1 bg-white rounded">
                {layerId}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available Presets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Available Presets</h3>
        <div className="bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
          <div className="space-y-2">
            {layerManager.allPresets.map((preset) => (
              <div key={preset.id} className="p-2 bg-white rounded">
                <p><strong>{preset.name}</strong> ({preset.id})</p>
                <p className="text-sm text-gray-600">{preset.description}</p>
                <p className="text-xs text-gray-500">Layers: {preset.layers.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Usage Instructions</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Ultra-Fast Mode:</strong> Use for user interactions and real-time updates</li>
          <li>• <strong>Traditional Mode:</strong> Use for initial loading and bulk operations</li>
          <li>• <strong>Batch Operations:</strong> More efficient for multiple layer changes</li>
          <li>• <strong>Layer Activation:</strong> Replaces the old activateLayers function</li>
          <li>• <strong>State Management:</strong> Integrates with existing Redux state</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedLayerManagerExample; 