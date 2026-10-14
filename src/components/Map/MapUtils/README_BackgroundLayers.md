# Background Layer Management System

This document describes the new robust background layer management system that replaces the previous confusing implementation.

## Overview

The new system provides a centralized way to manage background layers with the following features:

- **Automatic layer addition**: If a background layer doesn't exist, it's automatically added
- **Proper show/hide logic**: Only one background layer is shown at a time
- **Error handling**: Comprehensive error handling with callbacks
- **Redux integration**: Automatic Redux state updates
- **React hooks**: Easy-to-use React hooks for components

## Architecture

### Core Files

1. **`backgroundLayerManager.js`** - Core background layer management logic
2. **`useBackgroundLayer.js`** - React hook for easy integration
3. **`BackgroundLayerSelector.tsx`** - Example UI component

### Background Layer Configuration

Background layers are defined in `backgroundLayerManager.js`:

```javascript
const BACKGROUND_LAYERS = {
  'base': {
    name: 'Base Map',
    description: 'Standard street map',
    layerId: null, // No additional layer needed for base
    sourceId: null
  },
  'satellite': {
    name: 'Satellite',
    description: 'Satellite imagery',
    layerId: 'luchtfoto-pdok',
    sourceId: 'luchtfoto-pdok'
  }
};
```

## Usage

### Basic Usage with Hook

```typescript
import { useBackgroundLayer } from './MapUtils/useBackgroundLayer';

const MyComponent = ({ map }) => {
  const { setLayer, getAvailableLayers } = useBackgroundLayer(map);

  const handleSetBaseLayer = () => {
    setLayer('base');
  };

  const handleSetSatelliteLayer = () => {
    setLayer('satellite');
  };

  return (
    <div>
      <button onClick={handleSetBaseLayer}>Base Map</button>
      <button onClick={handleSetSatelliteLayer}>Satellite</button>
    </div>
  );
};
```

### Advanced Usage with Callbacks

```typescript
const { setLayer } = useBackgroundLayer(map);

setLayer('satellite', 
  (layerName) => {
    // Success callback
    console.log(`Successfully set to: ${layerName}`);
  },
  (error) => {
    // Error callback
    console.error(`Failed to set layer: ${error}`);
  }
);
```

### Direct Usage (without hook)

```typescript
import { setBackgroundLayer } from './MapUtils/backgroundLayerManager';

setBackgroundLayer(
  map,
  'satellite',
  (layerName) => {
    // Success callback
    dispatch(setMapStyle(layerName));
  },
  (error) => {
    // Error callback
    console.error(error);
  }
);
```

## Migration from Old System

### Before (Confusing)

```typescript
// Old way - confusing because callback does the real work
setBackgroundLayer(map, defaultLayerName, () => {
  dispatch(setMapStyle(defaultLayerName))
});
```

### After (Clear and Robust)

```typescript
// New way - clear and robust
const { setLayer } = useBackgroundLayer(map);
setLayer(defaultLayerName);
```

## Benefits

1. **Clear separation of concerns**: The function actually sets the background layer
2. **Automatic layer management**: Layers are added if they don't exist
3. **Proper error handling**: Comprehensive error handling with callbacks
4. **Type safety**: Better TypeScript support
5. **Testability**: Easier to test with clear interfaces
6. **Extensibility**: Easy to add new background layers

## Adding New Background Layers

To add a new background layer:

1. Add the layer configuration to `BACKGROUND_LAYERS` in `backgroundLayerManager.js`
2. Ensure the layer and source are defined in `layers/index.js` and `sources.js`
3. The system will automatically handle adding and showing/hiding the layer

## Error Handling

The system provides comprehensive error handling:

- **Map not loaded**: Waits for map to be ready
- **Invalid layer name**: Returns error via callback
- **Missing sources/layers**: Automatically adds them or returns error
- **Network issues**: Handles fetch failures gracefully

## Redux Integration

The system automatically updates Redux state when background layers are changed. The `setMapStyle` action is dispatched automatically when using the hook. 