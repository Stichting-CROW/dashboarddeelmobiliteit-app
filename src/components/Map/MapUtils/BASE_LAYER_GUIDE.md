# Base Layer Management Guide

This guide explains how to use the new base layer management functions for MapLibre GL JS.

## Overview

The new base layer management system provides multiple approaches for setting base layers, from simple style switching to advanced layer manipulation. Choose the approach that best fits your needs.

## Available Functions

### 1. `setBaseLayer(map, styleUrlOrObject, options)`
**Best for**: Complete style replacement with layer preservation
- Replaces the entire map style while preserving application layers
- Good for switching between completely different map styles
- Maintains backward compatibility

```javascript
import { setBaseLayer } from './MapUtils/map.js';

// Switch to satellite style
await setBaseLayer(map, 'https://api.maptiler.com/maps/hybrid/style.json?key=YOUR_KEY');

// Switch to custom style object
await setBaseLayer(map, customStyleObject, {
  preserveLayers: true,
  preserveSources: true
});
```

### 2. `setAdvancedBaseLayer(map, baseLayerType, options)`
**Best for**: Efficient base layer switching without full style replacement
- Only changes the base layer, keeping all other layers intact
- Much faster than full style replacement
- Better performance for frequent switching
- **Automatically handles source/layer cleanup to prevent conflicts**

```javascript
import { setAdvancedBaseLayer } from './MapUtils/map.js';

// Switch to terrain
await setAdvancedBaseLayer(map, 'terrain', {
  opacity: 1,
  preserveOverlays: true
});

// Switch to satellite
await setAdvancedBaseLayer(map, 'satellite', {
  opacity: 0.8,
  preserveOverlays: true
});

// Switch to hybrid
await setAdvancedBaseLayer(map, 'hybrid', {
  opacity: 1,
  preserveOverlays: true
});

// Use custom style
await setAdvancedBaseLayer(map, 'custom', {
  customStyleUrl: 'https://your-custom-style.json',
  opacity: 1,
  preserveOverlays: true
});
```

### 3. `addRasterBaseLayer(map, layerId, sourceUrl, options)`
**Best for**: Adding raster overlays on top of existing base layers
- Adds satellite imagery or other raster layers as overlays
- Useful for hybrid views
- Can be combined with existing base layers

```javascript
import { addRasterBaseLayer } from './MapUtils/map.js';

// Add satellite overlay
await addRasterBaseLayer(map, 'satellite-overlay', 
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    opacity: 0.5,
    minZoom: 10,
    maxZoom: 18,
    attribution: '© Esri'
  }
);
```

### 4. `toggleBaseLayer(map, styleName)`
**Best for**: Simple switching between predefined styles
- Convenience function for common use cases
- Uses the `getMapStyles()` configuration

```javascript
import { toggleBaseLayer } from './MapUtils/map.js';

// Switch between base and satellite
await toggleBaseLayer(map, 'base');
await toggleBaseLayer(map, 'satellite');
```

## Utility Functions

### `getCurrentBaseLayer(map)`
Get information about the currently active base layer.

```javascript
import { getCurrentBaseLayer } from './MapUtils/map.js';

const baseLayerInfo = getCurrentBaseLayer(map);
console.log(baseLayerInfo);
// Output: { id: 'base-layer', type: 'raster', source: 'base-source', sourceInfo: {...} }
```

### `isBaseLayerActive(map, baseLayerType)`
Check if a specific base layer type is currently active.

```javascript
import { isBaseLayerActive } from './MapUtils/map.js';

if (isBaseLayerActive(map, 'satellite')) {
  console.log('Satellite layer is active');
}
```

### `removeRasterBaseLayer(map, layerId)`
Remove a specific raster base layer.

```javascript
import { removeRasterBaseLayer } from './MapUtils/map.js';

removeRasterBaseLayer(map, 'satellite-overlay');
```

### `safeRemoveLayer(map, layerId)`
Safely remove a layer and its source, only removing the source if no other layers are using it.

```javascript
import { safeRemoveLayer } from './MapUtils/map.js';

safeRemoveLayer(map, 'my-layer');
```

### `isSourceInUse(map, sourceId)`
Check if a source is being used by any layers.

```javascript
import { isSourceInUse } from './MapUtils/map.js';

if (!isSourceInUse(map, 'my-source')) {
  map.removeSource('my-source');
}
```

## Performance Comparison

| Function | Performance | Use Case |
|----------|-------------|----------|
| `setAdvancedBaseLayer` | ⭐⭐⭐⭐⭐ | Base layer only switching |
| `addRasterBaseLayer` | ⭐⭐⭐⭐⭐ | Adding overlays |
| `setBaseLayer` | ⭐⭐⭐ | Complete style switching |
| `toggleBaseLayer` | ⭐⭐⭐⭐ | Simple predefined switching |

## Migration Guide

### From `applyMapStyle` (Legacy)

**Before:**
```javascript
import { applyMapStyle } from './MapUtils/map.js';

await applyMapStyle(map, styleUrl);
```

**After:**
```javascript
import { setBaseLayer } from './MapUtils/map.js';

await setBaseLayer(map, styleUrl);
```

### From `setBackgroundLayer` (Simple Layer Show/Hide)

**Before:**
```javascript
import { setBackgroundLayer } from './MapUtils/map.js';

setBackgroundLayer(map, 'satellite', setMapStyle);
```

**After:**
```javascript
import { setAdvancedBaseLayer } from './MapUtils/map.js';

await setAdvancedBaseLayer(map, 'satellite');
```

## Best Practices

### 1. Choose the Right Function
- Use `setAdvancedBaseLayer` for frequent switching
- Use `setBaseLayer` for complete style changes
- Use `addRasterBaseLayer` for overlays

### 2. Handle Errors Gracefully
```javascript
try {
  await setAdvancedBaseLayer(map, 'satellite');
} catch (error) {
  console.error('Failed to switch base layer:', error);
  // Fallback to default layer
  await setAdvancedBaseLayer(map, 'terrain');
}
```

### 3. Preload Styles for Better Performance
```javascript
import { preloadMapStyles } from './MapUtils/map.js';

// Preload all styles on app initialization
await preloadMapStyles();
```

### 4. Monitor Performance
```javascript
import { getCurrentBaseLayer, isBaseLayerActive } from './MapUtils/map.js';

// Check current state before switching
const currentLayer = getCurrentBaseLayer(map);
if (currentLayer && !isBaseLayerActive(map, 'satellite')) {
  await setAdvancedBaseLayer(map, 'satellite');
}
```

### 5. Clean Up Resources
```javascript
import { clearStyleCache } from './MapUtils/map.js';

// Clear cache when memory usage is high
clearStyleCache();
```

## Configuration

### Adding New Base Layer Types

To add new base layer types to `setAdvancedBaseLayer`:

```javascript
// In the baseLayerConfigs object
const baseLayerConfigs = {
  // ... existing configs
  custom_terrain: {
    source: {
      type: 'raster',
      tiles: ['https://your-tile-server/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© Your Attribution'
    },
    layer: {
      type: 'raster',
      paint: {
        'raster-opacity': 1
      }
    }
  }
};
```

### Custom Style URLs

For custom styles, ensure they follow the MapLibre style specification:

```json
{
  "version": 8,
  "sources": {
    "your-source": {
      "type": "raster",
      "tiles": ["https://your-tiles/{z}/{x}/{y}.png"],
      "tileSize": 256
    }
  },
  "layers": [
    {
      "id": "your-layer",
      "type": "raster",
      "source": "your-source"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Layer not appearing**: Check if the map is style loaded
2. **Performance issues**: Use `setAdvancedBaseLayer` instead of `setBaseLayer`
3. **Memory leaks**: Clear style cache periodically
4. **Network errors**: Implement retry logic and fallbacks

### ⚠️ **"Source already exists" Error**

**Problem**: You get an error like `Error: Source "base-source" already exists` when switching layers.

**Cause**: This happens when trying to add a source with the same ID that already exists in the map.

**Solution**: The `setAdvancedBaseLayer` function now automatically handles this by:
- Removing existing base layers and sources before adding new ones
- Checking if sources are used by other layers before removing them
- Using consistent source and layer IDs

**If you still encounter this error**:
```javascript
// Manual cleanup (if needed)
import { safeRemoveLayer } from './MapUtils/map.js';

// Remove the problematic layer and source
safeRemoveLayer(map, 'base-layer');

// Then switch to new layer
await setAdvancedBaseLayer(map, 'satellite');
```

### Debug Tips

```javascript
// Check map state
console.log('Map loaded:', map.isStyleLoaded());
console.log('Current style:', map.getStyle());

// Check layer state
const currentLayer = getCurrentBaseLayer(map);
console.log('Current base layer:', currentLayer);

// Check if specific layer is active
console.log('Satellite active:', isBaseLayerActive(map, 'satellite'));

// Check if source exists
console.log('Base source exists:', map.getSource('base-source') ? 'Yes' : 'No');
```

## Examples

### Complete Example: Base Layer Switcher Component

```javascript
import React, { useState, useEffect } from 'react';
import { 
  setAdvancedBaseLayer, 
  getCurrentBaseLayer, 
  isBaseLayerActive 
} from './MapUtils/map.js';

const BaseLayerSwitcher = ({ map }) => {
  const [currentLayer, setCurrentLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (map && map.isStyleLoaded()) {
      setCurrentLayer(getCurrentBaseLayer(map));
    }
  }, [map]);

  const switchLayer = async (layerType) => {
    if (!map || isLoading) return;

    setIsLoading(true);
    try {
      await setAdvancedBaseLayer(map, layerType);
      setCurrentLayer(getCurrentBaseLayer(map));
    } catch (error) {
      console.error('Failed to switch layer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="base-layer-switcher">
      <button 
        onClick={() => switchLayer('terrain')}
        disabled={isLoading || isBaseLayerActive(map, 'terrain')}
      >
        Terrain
      </button>
      <button 
        onClick={() => switchLayer('satellite')}
        disabled={isLoading || isBaseLayerActive(map, 'satellite')}
      >
        Satellite
      </button>
      <button 
        onClick={() => switchLayer('hybrid')}
        disabled={isLoading || isBaseLayerActive(map, 'hybrid')}
      >
        Hybrid
      </button>
    </div>
  );
};
```

### Error Handling Example

```javascript
import { setAdvancedBaseLayer, safeRemoveLayer } from './MapUtils/map.js';

const switchLayerWithFallback = async (map, layerType) => {
  try {
    await setAdvancedBaseLayer(map, layerType);
  } catch (error) {
    console.error('Primary method failed:', error);
    
    // Try manual cleanup and retry
    try {
      safeRemoveLayer(map, 'base-layer');
      await setAdvancedBaseLayer(map, layerType);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      // Last resort: use setBaseLayer
      const mapStyles = getMapStyles();
      await setBaseLayer(map, mapStyles[layerType === 'satellite' ? 'satellite' : 'base']);
    }
  }
};
```

This guide provides comprehensive information for using the new base layer management system effectively. 