import React, { useState, useEffect } from 'react';
import {
  setBaseLayer,
  setAdvancedBaseLayer,
  addRasterBaseLayer,
  removeRasterBaseLayer,
  toggleBaseLayer,
  getCurrentBaseLayer,
  isBaseLayerActive,
  getMapStyles
} from './map.js';

/**
 * Example component demonstrating the new base layer management functions.
 * This component shows different approaches to switching base layers.
 */
const BaseLayerExample = ({ map }) => {
  const [currentLayer, setCurrentLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);

  // Update current layer info when map changes
  useEffect(() => {
    if (map && map.isStyleLoaded()) {
      setCurrentLayer(getCurrentBaseLayer(map));
    }
  }, [map]);

  // Method 1: Using setBaseLayer (complete style replacement)
  const handleSetBaseLayer = async () => {
    if (!map || isLoading) return;
    
    setIsLoading(true);
    try {
      const mapStyles = getMapStyles();
      await setBaseLayer(map, mapStyles.satellite);
      setCurrentLayer(getCurrentBaseLayer(map));
    } catch (error) {
      console.error('Failed to set base layer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Method 2: Using setAdvancedBaseLayer (efficient layer switching)
  const handleSetAdvancedBaseLayer = async (layerType) => {
    if (!map || isLoading) return;
    
    setIsLoading(true);
    try {
      await setAdvancedBaseLayer(map, layerType, {
        opacity: 1,
        preserveOverlays: true
      });
      setCurrentLayer(getCurrentBaseLayer(map));
    } catch (error) {
      console.error('Failed to set advanced base layer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Method 3: Using addRasterBaseLayer (adding overlay)
  const handleAddOverlay = async () => {
    if (!map || isLoading || overlayActive) return;
    
    setIsLoading(true);
    try {
      await addRasterBaseLayer(map, 'satellite-overlay', 
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          opacity: 0.5,
          minZoom: 10,
          maxZoom: 18,
          attribution: '© Esri'
        }
      );
      setOverlayActive(true);
    } catch (error) {
      console.error('Failed to add overlay:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Method 4: Using toggleBaseLayer (simple switching)
  const handleToggleBaseLayer = async (styleName) => {
    if (!map || isLoading) return;
    
    setIsLoading(true);
    try {
      await toggleBaseLayer(map, styleName);
      setCurrentLayer(getCurrentBaseLayer(map));
    } catch (error) {
      console.error('Failed to toggle base layer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove overlay
  const handleRemoveOverlay = () => {
    if (!map || !overlayActive) return;
    
    removeRasterBaseLayer(map, 'satellite-overlay');
    setOverlayActive(false);
  };

  if (!map) {
    return <div>Map not available</div>;
  }

  return (
    <div className="base-layer-example" style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Base Layer Management Examples</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Current Layer Info:</h4>
        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {JSON.stringify(currentLayer, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Method 1: Complete Style Replacement (setBaseLayer)</h4>
        <button 
          onClick={handleSetBaseLayer}
          disabled={isLoading}
          style={{ marginRight: '10px' }}
        >
          {isLoading ? 'Loading...' : 'Switch to Satellite (Complete Style)'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Method 2: Efficient Layer Switching (setAdvancedBaseLayer)</h4>
        <button 
          onClick={() => handleSetAdvancedBaseLayer('terrain')}
          disabled={isLoading || isBaseLayerActive(map, 'terrain')}
          style={{ marginRight: '10px' }}
        >
          Terrain
        </button>
        <button 
          onClick={() => handleSetAdvancedBaseLayer('satellite')}
          disabled={isLoading || isBaseLayerActive(map, 'satellite')}
          style={{ marginRight: '10px' }}
        >
          Satellite
        </button>
        <button 
          onClick={() => handleSetAdvancedBaseLayer('hybrid')}
          disabled={isLoading || isBaseLayerActive(map, 'hybrid')}
        >
          Hybrid
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Method 3: Adding Overlays (addRasterBaseLayer)</h4>
        <button 
          onClick={handleAddOverlay}
          disabled={isLoading || overlayActive}
          style={{ marginRight: '10px' }}
        >
          Add Satellite Overlay
        </button>
        <button 
          onClick={handleRemoveOverlay}
          disabled={!overlayActive}
        >
          Remove Overlay
        </button>
        {overlayActive && (
          <span style={{ marginLeft: '10px', color: 'green' }}>
            ✓ Overlay Active
          </span>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Method 4: Simple Toggle (toggleBaseLayer)</h4>
        <button 
          onClick={() => handleToggleBaseLayer('base')}
          disabled={isLoading}
          style={{ marginRight: '10px' }}
        >
          Toggle to Base
        </button>
        <button 
          onClick={() => handleToggleBaseLayer('satellite')}
          disabled={isLoading}
        >
          Toggle to Satellite
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Layer Status:</h4>
        <ul style={{ fontSize: '14px' }}>
          <li>Terrain Active: {isBaseLayerActive(map, 'terrain') ? '✓' : '✗'}</li>
          <li>Satellite Active: {isBaseLayerActive(map, 'satellite') ? '✓' : '✗'}</li>
          <li>Hybrid Active: {isBaseLayerActive(map, 'hybrid') ? '✓' : '✗'}</li>
          <li>Overlay Active: {overlayActive ? '✓' : '✗'}</li>
        </ul>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p><strong>Note:</strong> This example demonstrates different approaches to base layer management.</p>
        <p><strong>Performance:</strong> Method 2 (setAdvancedBaseLayer) is fastest for frequent switching.</p>
        <p><strong>Flexibility:</strong> Method 3 (addRasterBaseLayer) allows for custom overlays.</p>
      </div>
    </div>
  );
};

export default BaseLayerExample; 