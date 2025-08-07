import React from 'react';
import { useBackgroundLayer } from './useBackgroundLayer';
import { BackgroundLayer } from './backgroundLayerManager';

interface BackgroundLayerSelectorProps {
  map: any;
}

/**
 * Example component that demonstrates the new background layer system
 * This shows how to create a UI for selecting background layers
 */
export const BackgroundLayerSelector: React.FC<BackgroundLayerSelectorProps> = ({ map }) => {
  const { setLayer, getAvailableLayers } = useBackgroundLayer(map);
  const availableLayers = getAvailableLayers();

  const handleLayerChange = (layerName: string) => {
    setLayer(layerName, 
      (layerName) => {
        console.log(`Successfully set background layer to: ${layerName}`);
      },
      (error) => {
        console.error(`Failed to set background layer: ${error}`);
      }
    );
  };

  return (
    <div className="background-layer-selector">
      <h4>Background Layer</h4>
      <div className="layer-options">
        {Object.entries(availableLayers).map(([key, layer]) => (
          <button
            key={key}
            onClick={() => handleLayerChange(key)}
            className="layer-option"
          >
            {(layer as BackgroundLayer).name}
          </button>
        ))}
      </div>
    </div>
  );
}; 