import React, { useEffect, useState } from 'react';
import { useNewLayerManager } from '../hooks/useNewLayerManager';

/**
 * Example component demonstrating the new layer management system
 */
const NewLayerManagerExample: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  const {
    setMap,
    setLayerVisibility,
    batchSetLayerVisibility,
    getLayerVisibility,
    layerExists,
    setBaseLayer,
    toggleZones,
    currentState,
    validateState,
    getPerformanceStats,
    getQueueStatus,
    isInitialized
  } = useNewLayerManager();

  // Simulate map initialization
  useEffect(() => {
    // In a real app, this would be the actual map instance
    const mockMap = {
      isStyleLoaded: () => true,
      getLayer: (id: string) => ({ id }),
      getSource: (id: string) => ({ id }),
      getLayoutProperty: (id: string, prop: string) => 'visible',
      setLayoutProperty: (id: string, prop: string, value: string) => console.log(`Set ${prop} to ${value} for ${id}`),
      addLayer: (layer: any) => console.log('Added layer:', layer),
      addSource: (id: string, config: any) => console.log('Added source:', id, config),
      removeLayer: (id: string) => console.log('Removed layer:', id),
      dragPan: { disable: () => console.log('Disabled drag'), enable: () => console.log('Enabled drag') },
      scrollZoom: { disable: () => console.log('Disabled zoom'), enable: () => console.log('Enabled zoom') }
    };

    setMapInstance(mockMap);
    setMap(mockMap);
  }, [setMap]);

  // Example: Set layer visibility
  const handleSetLayerVisibility = async () => {
    console.log('Setting layer visibility...');
    const result = await setLayerVisibility('vehicles-point', true, {
      useUltraFast: true,
      skipAnimation: true
    });
    console.log('Set layer visibility result:', result);
  };

  // Example: Batch operations
  const handleBatchOperations = async () => {
    console.log('Executing batch operations...');
    const operations = [
      { layerId: 'vehicles-point', visible: true },
      { layerId: 'vehicles-clusters', visible: false },
      { layerId: 'zones-geodata', visible: true }
    ];

    const result = await batchSetLayerVisibility(operations, {
      useUltraFast: true,
      skipAnimation: true
    });
    console.log('Batch operations result:', result);
  };

  // Example: Set base layer
  const handleSetBaseLayer = async () => {
    console.log('Setting base layer...');
    await setBaseLayer('satellite');
  };

  // Example: Toggle zones
  const handleToggleZones = async () => {
    console.log('Toggling zones...');
    await toggleZones();
  };

  // Example: Validate state
  const handleValidateState = async () => {
    console.log('Validating state...');
    const result = await validateState();
    setValidationResult(result);
    console.log('Validation result:', result);
  };

  // Example: Get performance stats
  const handleGetPerformanceStats = () => {
    console.log('Getting performance stats...');
    const stats = getPerformanceStats();
    setPerformanceStats(stats);
    console.log('Performance stats:', stats);
  };

  // Example: Check layer visibility
  const handleCheckLayerVisibility = () => {
    const isVisible = getLayerVisibility('vehicles-point');
    console.log('Layer visibility:', isVisible);
  };

  // Example: Check if layer exists
  const handleCheckLayerExists = () => {
    const exists = layerExists('vehicles-point');
    console.log('Layer exists:', exists);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>New Layer Manager Example</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status</h2>
        <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
        <p>Map Ready: {mapInstance ? 'Yes' : 'No'}</p>
        <p>Queue Status: {JSON.stringify(getQueueStatus(), null, 2)}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Current State</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(currentState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button onClick={handleSetLayerVisibility} style={buttonStyle}>
            Set Layer Visibility
          </button>
          <button onClick={handleBatchOperations} style={buttonStyle}>
            Batch Operations
          </button>
          <button onClick={handleSetBaseLayer} style={buttonStyle}>
            Set Base Layer
          </button>
          <button onClick={handleToggleZones} style={buttonStyle}>
            Toggle Zones
          </button>
          <button onClick={handleValidateState} style={buttonStyle}>
            Validate State
          </button>
          <button onClick={handleGetPerformanceStats} style={buttonStyle}>
            Get Performance Stats
          </button>
          <button onClick={handleCheckLayerVisibility} style={buttonStyle}>
            Check Layer Visibility
          </button>
          <button onClick={handleCheckLayerExists} style={buttonStyle}>
            Check Layer Exists
          </button>
        </div>
      </div>

      {validationResult && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Validation Result</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(validationResult, null, 2)}
          </pre>
        </div>
      )}

      {performanceStats && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Performance Statistics</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(performanceStats, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>Usage Examples</h2>
        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
          <h3>Basic Layer Visibility</h3>
          <code>
            {`const result = await setLayerVisibility('vehicles-point', true, {
  useUltraFast: true,
  skipAnimation: true
});`}
          </code>

          <h3>Batch Operations</h3>
          <code>
            {`const operations = [
  { layerId: 'vehicles-point', visible: true },
  { layerId: 'zones-geodata', visible: false }
];
const result = await batchSetLayerVisibility(operations);`}
          </code>

          <h3>Base Layer Switching</h3>
          <code>
            {`await setBaseLayer('satellite');`}
          </code>

          <h3>State Validation</h3>
          <code>
            {`const validation = await validateState();
if (!validation.valid) {
  console.log('Issues found:', validation.issues);
}`}
          </code>

          <h3>Performance Monitoring</h3>
          <code>
            {`const stats = getPerformanceStats();
console.log('Average operation time:', stats.averageDuration);`}
          </code>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Benefits of the New System</h2>
        <ul>
          <li><strong>Type Safety:</strong> All operations are type-safe with comprehensive TypeScript support</li>
          <li><strong>Error Handling:</strong> Centralized error handling with automatic recovery strategies</li>
          <li><strong>Performance:</strong> Batch operations and performance monitoring</li>
          <li><strong>State Validation:</strong> Automatic detection and fixing of inconsistent states</li>
          <li><strong>Queue Management:</strong> Proper operation queuing to prevent race conditions</li>
          <li><strong>Monitoring:</strong> Comprehensive performance and state monitoring</li>
        </ul>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 15px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};

export default NewLayerManagerExample; 