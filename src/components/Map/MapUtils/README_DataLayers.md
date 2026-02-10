# Data Layer Management System

This document describes the new data layer management system that allows multiple data layers to be active simultaneously.

## Overview

The new system provides a centralized way to manage data layers with the following features:

- **Multiple active layers**: Multiple data layers can be active at the same time
- **Toggle functionality**: Users can toggle layers on/off independently
- **Display mode specific**: Different data layers are available for different display modes
- **Automatic layer addition**: If a data layer doesn't exist, it's automatically added
- **Proper show/hide logic**: Layers are properly shown/hidden based on state
- **Error handling**: Comprehensive error handling with callbacks
- **Redux integration**: Automatic Redux state updates
- **React hooks**: Easy-to-use React hooks for components

## Architecture

### Core Files

1. **`dataLayerManager.js`** - Core data layer management logic
2. **`useDataLayer.ts`** - React hook for easy integration
3. **`SelectLayerModal.tsx`** - Updated UI component

### Data Layer Configuration

Data layers are defined in `dataLayerManager.js`:

```javascript
const DATA_LAYERS = {
  'displaymode-park': {
    'parkeerdata-heatmap': {
      name: 'Heat Map',
      layerId: 'vehicles-heatmap',
      sourceId: 'vehicles',
      displayMode: 'displaymode-park'
    },
    'parkeerdata-clusters': {
      name: 'Clusters',
      layerId: 'vehicles-clusters',
      sourceId: 'vehicles',
      displayMode: 'displaymode-park'
    },
    'parkeerdata-voertuigen': {
      name: 'Voertuigen',
      layerId: 'vehicles-point',
      sourceId: 'vehicles',
      displayMode: 'displaymode-park'
    }
  },
  'displaymode-rentals': {
    // ... rental layers
  }
};
```

## Usage

### Basic Usage with Hook

```typescript
import { useDataLayer } from './MapUtils/useDataLayer';

const MyComponent = ({ map }) => {
  const { setLayer, toggleLayer, getAvailableLayers } = useDataLayer(map);

  const handleToggleHeatMap = () => {
    toggleLayer('parkeerdata-heatmap', 'displaymode-park', isActive);
  };

  const handleSetClusters = () => {
    setLayer('parkeerdata-clusters', 'displaymode-park');
  };

  return (
    <div>
      <button onClick={handleToggleHeatMap}>Toggle Heat Map</button>
      <button onClick={handleSetClusters}>Show Clusters</button>
    </div>
  );
};
```

### Advanced Usage with Callbacks

```typescript
const { setLayer } = useDataLayer(map);

setLayer('parkeerdata-heatmap', 'displaymode-park', 
  (layerName) => {
    // Success callback
    console.log(`Successfully activated: ${layerName}`);
  },
  (error) => {
    // Error callback
    console.error(`Failed to activate layer: ${error}`);
  }
);
```

## Redux State

The new system uses a new Redux state structure:

```javascript
{
  // ... existing state
  active_data_layers: {
    'displaymode-park': ['parkeerdata-voertuigen', 'parkeerdata-clusters'],
    'displaymode-rentals': ['verhuurdata-voertuigen']
  }
}
```

## Migration from Old System

The old system used single layer selection:
- `view_park`: Single park layer
- `view_rentals`: Single rentals layer

The new system supports multiple layers:
- `active_data_layers['displaymode-park']`: Array of active park layers
- `active_data_layers['displaymode-rentals']`: Array of active rentals layers

## API Reference

### useDataLayer Hook

```typescript
const {
  setLayer,
  unsetLayer,
  toggleLayer,
  getAvailableLayers,
  getCurrentLayers
} = useDataLayer(map);
```

#### setLayer(layerName, displayMode, onSuccess?, onError?)
Activates a data layer.

#### unsetLayer(layerName, displayMode, onSuccess?, onError?)
Deactivates a data layer.

#### toggleLayer(layerName, displayMode, isVisible, onSuccess?, onError?)
Toggles a data layer on/off.

#### getAvailableLayers(displayMode)
Returns available layers for a display mode.

#### getCurrentLayers(displayMode)
Returns currently active layers for a display mode.

### dataLayerManager Functions

#### setDataLayer(map, layerName, displayMode, onSuccess?, onError?)
Core function to activate a data layer.

#### unsetDataLayer(map, layerName, displayMode, onSuccess?, onError?)
Core function to deactivate a data layer.

#### toggleDataLayer(map, layerName, displayMode, isVisible, onSuccess?, onError?)
Core function to toggle a data layer.

#### getAvailableDataLayers(displayMode)
Returns available data layers for a display mode.

#### getCurrentDataLayers(map, displayMode)
Returns currently active data layers for a display mode. 