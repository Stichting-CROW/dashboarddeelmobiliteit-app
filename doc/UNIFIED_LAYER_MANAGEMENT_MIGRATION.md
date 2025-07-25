# Unified Layer Management Migration Guide

## Overview

This document explains how to transform the existing codebase to use a unified layer management system that consolidates all the different approaches for enabling/disabling layers into a single, consistent API.

## Current Problems

The current codebase has multiple ways of managing layers, which creates complexity and potential conflicts:

1. **Traditional layer activation** via `activateLayers()` function in `MapUtils/layers.js`
2. **Ultra-fast layer switching** via `useUltraFastLayerSwitch` hook
3. **Optimized layer switching** via `useOptimizedLayerSwitch` hook
4. **Direct MapLibre API calls** scattered throughout the codebase
5. **MapBox utils** as fallbacks in various places

## Solution: Unified Layer Manager

The new `useUnifiedLayerManager` hook provides a single, consistent API for all layer operations.

### Key Features

- **Single API**: One way to enable/disable layers
- **Performance options**: Choose between traditional and ultra-fast switching
- **Fallback support**: Automatic fallback to MapBox utils when needed
- **Batch operations**: Efficient batch layer operations
- **State management**: Integrates with existing Redux state
- **Backward compatibility**: Works with existing layer configuration

## Migration Steps

### 1. Replace Multiple Layer Management Hooks

**Before:**
```typescript
// Multiple hooks for different purposes
import { useUltraFastLayerSwitch } from './useUltraFastLayerSwitch';
import { useOptimizedLayerSwitch } from './useOptimizedLayerSwitch';
import { useLayerManager } from './useLayerManager';

const ultraFastSwitch = useUltraFastLayerSwitch();
const optimizedSwitch = useOptimizedLayerSwitch();
const layerManager = useLayerManager();
```

**After:**
```typescript
// Single unified hook
import { useUnifiedLayerManager } from './useUnifiedLayerManager';

const layerManager = useUnifiedLayerManager();
```

### 2. Replace Direct MapLibre API Calls

**Before:**
```typescript
// Direct API calls scattered throughout code
map.setLayoutProperty(layerId, 'visibility', 'visible');
map.setLayoutProperty(layerId, 'visibility', 'none');
map.U.show(layerId);
map.U.hide(layerId);
```

**After:**
```typescript
// Unified API calls
layerManager.setLayerVisibility(layerId, true);
layerManager.setLayerVisibility(layerId, false);
```

### 3. Replace Base Layer Switching

**Before:**
```typescript
// Multiple approaches for base layer switching
ultraFastSwitch.setBaseLayer('satellite');
optimizedSwitch.setBaseLayer('satellite');
layerManager.setBaseLayer('satellite');
```

**After:**
```typescript
// Single approach with performance options
layerManager.setBaseLayer('satellite', {
  useUltraFast: true,  // For performance-critical operations
  skipAnimation: true,
  batch: true
});
```

### 4. Replace Layer Activation

**Before:**
```typescript
// Old activateLayers function
import { activateLayers } from './MapUtils/layers';
activateLayers(map, layers, activeLayers);
```

**After:**
```typescript
// Unified layer activation
layerManager.activateLayers(activeLayers, {
  useUltraFast: false,  // For traditional switching
  skipAnimation: false,
  preserveExisting: false
});
```

### 5. Replace Zones Toggle

**Before:**
```typescript
// Multiple approaches for zones toggle
ultraFastSwitch.toggleZones();
optimizedSwitch.toggleZones();
layerManager.toggleZones();
```

**After:**
```typescript
// Single approach with performance options
layerManager.toggleZones({
  useUltraFast: true,  // For instant feedback
  skipAnimation: true
});
```

## API Reference

### Core Methods

#### `setLayerVisibility(layerId, visible, options)`
Set the visibility of a single layer.

```typescript
layerManager.setLayerVisibility('vehicles-point', true, {
  useUltraFast: false,
  skipAnimation: false
});
```

#### `batchSetLayerVisibility(operations, options)`
Set visibility for multiple layers efficiently.

```typescript
layerManager.batchSetLayerVisibility([
  { layerId: 'vehicles-point', visible: true },
  { layerId: 'vehicles-clusters', visible: false }
], {
  useUltraFast: true,
  skipAnimation: true
});
```

#### `setBaseLayer(baseLayer, options)`
Switch the base map layer (base/satellite/hybrid).

```typescript
layerManager.setBaseLayer('satellite', {
  useUltraFast: true,
  skipAnimation: true,
  batch: true
});
```

#### `toggleZones(options)`
Toggle zones visibility.

```typescript
layerManager.toggleZones({
  useUltraFast: true,
  skipAnimation: true
});
```

#### `activateLayers(layerIds, options)`
Activate a set of layers (replaces old activateLayers function).

```typescript
layerManager.activateLayers(['vehicles-point', 'zones-geodata'], {
  useUltraFast: false,
  skipAnimation: false,
  preserveExisting: false
});
```

### Utility Methods

#### `getLayerVisibility(layerId)`
Get current visibility of a layer.

```typescript
const isVisible = layerManager.getLayerVisibility('vehicles-point');
```

#### `layerExists(layerId)`
Check if a layer exists on the map.

```typescript
const exists = layerManager.layerExists('vehicles-point');
```

#### `addLayer(layerId)`
Add a layer to the map.

```typescript
const success = layerManager.addLayer('vehicles-point');
```

#### `removeLayer(layerId)`
Remove a layer from the map.

```typescript
const success = layerManager.removeLayer('vehicles-point');
```

### State Management

The unified layer manager delegates to the existing `useLayerManager` for state management:

```typescript
// All existing state management methods are available
const { currentState, getActiveLayers, getActiveSources } = layerManager;
```

## Performance Considerations

### When to Use Ultra-Fast Mode

- **User interactions**: When users click buttons or toggle switches
- **Real-time updates**: When layers need to update immediately
- **Base layer switching**: For smooth map style transitions

### When to Use Traditional Mode

- **Initial loading**: When the map first loads
- **Bulk operations**: When many layers need to be activated at once
- **Data-dependent operations**: When layers depend on data availability

### Example Performance Optimization

```typescript
// For user interactions - use ultra-fast mode
const handleZonesToggle = () => {
  layerManager.toggleZones({ useUltraFast: true, skipAnimation: true });
};

// For initial loading - use traditional mode
useEffect(() => {
  layerManager.activateLayers(activeLayers, { useUltraFast: false });
}, [activeLayers]);
```

## Migration Checklist

- [ ] Replace `useUltraFastLayerSwitch` with `useUnifiedLayerManager`
- [ ] Replace `useOptimizedLayerSwitch` with `useUnifiedLayerManager`
- [ ] Replace direct `map.setLayoutProperty` calls with `setLayerVisibility`
- [ ] Replace direct `map.U.show/hide` calls with `setLayerVisibility`
- [ ] Replace `activateLayers` function calls with `activateLayers` method
- [ ] Update base layer switching to use `setBaseLayer`
- [ ] Update zones toggle to use `toggleZones`
- [ ] Remove old layer management hooks
- [ ] Test all layer operations work correctly
- [ ] Verify performance is maintained or improved

## Benefits

1. **Simplified codebase**: One way to manage layers
2. **Better maintainability**: Centralized layer logic
3. **Consistent behavior**: Same API for all layer operations
4. **Performance flexibility**: Choose the right mode for each use case
5. **Backward compatibility**: Works with existing configuration
6. **Error handling**: Consistent error handling and fallbacks
7. **Debugging**: Centralized logging and debugging

## Example: Complete Component Migration

**Before:**
```typescript
const MapComponent = () => {
  const ultraFastSwitch = useUltraFastLayerSwitch();
  const optimizedSwitch = useOptimizedLayerSwitch();
  const layerManager = useLayerManager();
  
  const handleBaseLayerChange = (style) => {
    ultraFastSwitch.setBaseLayer(style);
  };
  
  const handleZonesToggle = () => {
    optimizedSwitch.toggleZones();
  };
  
  useEffect(() => {
    activateLayers(map, layers, activeLayers);
  }, [activeLayers]);
};
```

**After:**
```typescript
const MapComponent = () => {
  const layerManager = useUnifiedLayerManager();
  
  const handleBaseLayerChange = (style) => {
    layerManager.setBaseLayer(style, { useUltraFast: true });
  };
  
  const handleZonesToggle = () => {
    layerManager.toggleZones({ useUltraFast: true });
  };
  
  useEffect(() => {
    layerManager.activateLayers(activeLayers, { useUltraFast: false });
  }, [activeLayers]);
};
```

This migration provides a cleaner, more maintainable codebase with a single, consistent API for all layer management operations. 