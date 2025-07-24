# Layer Management System Refactor

## Overview

This document describes the refactored layer management system that addresses the error-prone and scattered layer selection logic in the current codebase.

## Current Issues

### 1. Scattered Logic
- Layer selection logic is spread across multiple files (`MapPage.jsx`, `SelectLayerModal.tsx`, `layers.js` reducer)
- Hard to maintain and understand the relationship between display modes and actual layers
- Duplicate logic for determining which layers should be active

### 2. Hard-coded Layer Names
- Layer names are hard-coded in multiple places
- No central source of truth for layer definitions
- Difficult to add new layers or modify existing ones

### 3. Complex State Management
- Redux state uses multiple separate properties (`displaymode`, `view_park`, `view_rentals`, `map_style`, `zones_visible`)
- Complex mapping between display modes and actual layer combinations
- Error-prone state transitions

### 4. Type Safety Issues
- Using TypeScript annotations in `.jsx` files
- No type safety for layer configurations
- Runtime errors due to missing type checking

## New Architecture

### 1. Centralized Layer Configuration (`src/config/layerConfig.ts`)

```typescript
// Define all available layers with metadata
const layers: Record<string, LayerConfig> = {
  'base': {
    id: 'base',
    name: 'Standaard',
    type: 'background',
    category: 'base',
    visible: true,
    order: 1,
    description: 'Standaard kaartlaag met wegen en gebouwen'
  },
  // ... more layers
};

// Define layer presets for different display modes
const presets: LayerPreset[] = [
  {
    id: 'park-points',
    name: 'Voertuigen',
    description: 'Toon individuele voertuigen als punten',
    category: 'park',
    layers: ['vehicles-point']
  },
  // ... more presets
];
```

**Benefits:**
- Single source of truth for all layer definitions
- Easy to add new layers or modify existing ones
- Clear relationship between display modes and layer combinations
- Type-safe layer configurations

### 2. Layer Manager Hook (`src/hooks/useLayerManager.ts`)

```typescript
export const useLayerManager = () => {
  // Convert old state format to new format
  const currentState: LayerState = useMemo(() => {
    // Logic to convert old Redux state to new layer state
  }, [layerState, filter, isLoggedIn]);

  // Clean interface for layer operations
  const setBaseLayer = useCallback((baseLayer: 'base' | 'satellite' | 'hybrid') => {
    dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: baseLayer });
  }, [dispatch]);

  const getActiveLayers = useCallback(() => {
    return currentState.visibleLayers;
  }, [currentState.visibleLayers]);

  return {
    currentState,
    setBaseLayer,
    getActiveLayers,
    // ... more methods
  };
};
```

**Benefits:**
- Clean, reusable interface for layer operations
- Encapsulates complex state conversion logic
- Provides type-safe methods for layer management
- Easy to test and maintain

### 3. Type Definitions (`src/types/LayerTypes.ts`)

```typescript
export interface LayerConfig {
  id: string;
  name: string;
  type: 'background' | 'data' | 'overlay';
  category: 'base' | 'satellite' | 'hybrid' | 'zones' | 'vehicles' | 'rentals' | 'policy-hubs';
  source?: string;
  visible: boolean;
  order: number;
  description?: string;
  icon?: string;
}

export interface LayerPreset {
  id: string;
  name: string;
  description: string;
  layers: string[];
  category: 'park' | 'rentals' | 'zones' | 'policy-hubs';
}
```

**Benefits:**
- Type safety throughout the application
- Clear contracts for layer configurations
- Better IDE support and autocomplete
- Reduced runtime errors

### 4. New SelectLayer Component (`src/components/SelectLayer/SelectLayerNew.tsx`)

```typescript
const SelectLayerNew: React.FC<SelectLayerNewProps> = ({ isVisible, onClose }) => {
  const {
    currentState,
    getLayersByCategory,
    getPresetsByCategory,
    isPresetActive,
    setBaseLayer,
    setParkView,
    setRentalsView
  } = useLayerManager();

  // Clean, tabbed interface for layer selection
  return (
    <Modal>
      <div className="SelectLayer">
        <div className="layer-tabs">
          <button onClick={() => setActiveTab('base')}>Basislaag</button>
          <button onClick={() => setActiveTab('data')}>Datalaag</button>
        </div>
        {/* Tab content */}
      </div>
    </Modal>
  );
};
```

**Benefits:**
- Cleaner, more intuitive user interface
- Tabbed organization of base layers and data layers
- Consistent with layer manager hook
- Better separation of concerns

## Migration Strategy

### Phase 1: Add New System (Current)
1. ✅ Create type definitions
2. ✅ Create layer configuration
3. ✅ Create layer manager hook
4. ✅ Create new SelectLayer component
5. ✅ Update MapPage to use layer manager

### Phase 2: Gradual Migration
1. Replace old SelectLayer component with new one
2. Update other components to use layer manager
3. Remove old layer logic from MapPage.jsx
4. Clean up unused imports and constants

### Phase 3: State Simplification
1. Simplify Redux state structure
2. Remove old display mode constants
3. Update action creators and reducers
4. Add comprehensive tests

## Usage Examples

### Using the Layer Manager Hook

```typescript
// In any component
const {
  currentState,
  getActiveLayers,
  getActiveSources,
  setBaseLayer,
  toggleZones
} = useLayerManager();

// Get active layers for MapComponent
const layers = getActiveLayers();
const sources = getActiveSources();

// Change base layer
setBaseLayer('satellite');

// Toggle zones visibility
toggleZones();
```

### Adding a New Layer

```typescript
// 1. Add to layer configuration
const layers: Record<string, LayerConfig> = {
  'new-layer': {
    id: 'new-layer',
    name: 'New Layer',
    type: 'data',
    category: 'vehicles',
    source: 'new-source',
    visible: false,
    order: 25,
    description: 'Description of new layer'
  }
};

// 2. Add to preset if needed
const presets: LayerPreset[] = [
  {
    id: 'park-with-new-layer',
    name: 'Park with New Layer',
    description: 'Park mode with new layer',
    category: 'park',
    layers: ['vehicles-point', 'new-layer']
  }
];
```

### Creating a Custom Layer Component

```typescript
const CustomLayerComponent: React.FC = () => {
  const { isLayerVisible, getActiveLayers } = useLayerManager();
  
  // Check if layer is visible
  if (!isLayerVisible('custom-layer')) {
    return null;
  }
  
  // Get all active layers
  const activeLayers = getActiveLayers();
  
  return (
    <div>
      {/* Custom layer rendering */}
    </div>
  );
};
```

## Benefits of the New System

### 1. Maintainability
- Centralized layer definitions
- Clear separation of concerns
- Easy to add new layers or modify existing ones
- Type-safe configurations

### 2. Developer Experience
- Better IDE support with TypeScript
- Clear interfaces and contracts
- Reusable layer management logic
- Easier debugging and testing

### 3. User Experience
- Cleaner, more intuitive layer selection interface
- Consistent behavior across different display modes
- Better error handling and validation

### 4. Performance
- Optimized layer state calculations
- Reduced redundant logic
- Better memoization of layer configurations

## Future Enhancements

### 1. Layer Groups
- Group related layers together
- Bulk operations on layer groups
- Hierarchical layer organization

### 2. Custom Layer Presets
- Allow users to create custom layer combinations
- Save and share layer presets
- Import/export layer configurations

### 3. Advanced Layer Controls
- Layer opacity controls
- Layer blending modes
- Conditional layer visibility based on zoom level

### 4. Layer Analytics
- Track layer usage patterns
- Performance monitoring for different layer combinations
- User behavior analytics

## Conclusion

The new layer management system provides a solid foundation for handling complex map layer requirements while maintaining code quality and developer productivity. The centralized configuration, type safety, and clean interfaces make it much easier to add new features and maintain existing functionality. 