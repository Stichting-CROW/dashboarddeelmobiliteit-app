# Map Layer Switching Improvements

On 2025-07-21 we have updated the map layer switcher to a modal with all layers. These were instructions. 

## Overview
This document outlines the improvements made to the map layer switching system to make it faster, more efficient, and easier to develop with.

## Key Improvements

### 1. **Custom Hook Architecture**
- **File**: `src/components/SelectLayer/useMapLayerSwitch.ts`
- **Benefit**: Encapsulates map layer switching logic, making it reusable and testable
- **Features**:
  - Proper TypeScript typing
  - Error handling with fallback mechanisms
  - Performance monitoring
  - Style caching

### 2. **Map Context Provider**
- **File**: `src/components/Map/MapContext.tsx`
- **Benefit**: Eliminates dependency on global `window['ddMap']` variable
- **Features**:
  - React Context for map instance management
  - Backward compatibility with existing code
  - Type-safe map access

### 3. **Enhanced Map Utilities**
- **File**: `src/components/Map/MapUtils/map.js`
- **Improvements**:
  - Style caching to avoid repeated network requests
  - Better error handling for style fetching
  - Preloading functionality for faster switching
  - Memory management with cache clearing

### 4. **Performance Monitoring**
- **File**: `src/components/Map/MapUtils/performance.ts`
- **Features**:
  - Tracks layer switching performance
  - Monitors cache hit rates
  - Development-only logging
  - Memory leak prevention

### 5. **Refactored Component**
- **File**: `src/components/SelectLayer/SelectLayerModal.tsx`
- **Improvements**:
  - Cleaner, more maintainable code
  - Better separation of concerns
  - Improved error handling
  - Type safety

## Performance Benefits

### Before
- Map styles fetched on every switch
- Global window variable dependency
- No error handling or fallbacks
- No performance monitoring
- Inconsistent state management

### After
- **Cached styles** for instant switching after first load
- **Proper React patterns** with Context and hooks
- **Comprehensive error handling** with fallback mechanisms
- **Performance monitoring** to identify bottlenecks
- **Consistent state management** through Redux

## Usage

### Basic Usage
```typescript
import { useMapLayerSwitch } from './useMapLayerSwitch';

const MyComponent = () => {
  const { switchMapLayer, currentMapStyle } = useMapLayerSwitch();
  
  return (
    <button onClick={() => switchMapLayer('base')}>
      Switch to Base Layer
    </button>
  );
};
```

### With Map Provider
```typescript
import { MapProvider } from './MapContext';

const App = () => {
  return (
    <MapProvider>
      <MapComponent />
      <SelectLayerModal />
    </MapProvider>
  );
};
```

## Development Benefits

### 1. **Testability**
- Custom hooks can be easily unit tested
- Map context provides controlled map access
- Performance monitoring helps identify issues

### 2. **Maintainability**
- Clear separation of concerns
- TypeScript provides compile-time safety
- Consistent patterns across components

### 3. **Debugging**
- Performance metrics in development mode
- Better error messages and fallbacks
- Structured logging

### 4. **Extensibility**
- Easy to add new map styles
- Hook-based architecture allows for easy composition
- Context pattern supports multiple map instances

## Migration Guide

### For Existing Components
1. Wrap your app with `MapProvider`
2. Replace `window['ddMap']` usage with `useMap()` hook
3. Use `useMapLayerSwitch()` for layer switching
4. Remove direct calls to `setBackgroundLayer`

### For New Components
1. Use the provided hooks and context
2. Follow the established patterns
3. Add performance monitoring where needed

## Future Improvements

### 1. **Advanced Caching**
- Implement LRU cache for better memory management
- Add cache invalidation strategies
- Consider service worker caching for offline support

### 2. **Progressive Loading**
- Load map styles in background
- Implement loading states and progress indicators
- Add preloading strategies based on user behavior

### 3. **Enhanced Error Handling**
- Retry mechanisms for failed style loads
- User-friendly error messages
- Graceful degradation strategies

### 4. **Performance Optimization**
- Web Workers for style processing
- Compression for map styles
- Lazy loading of non-critical styles

## Monitoring and Debugging

### Performance Metrics
```typescript
import { mapPerformanceMonitor } from './MapUtils/performance';

// Get average switch time
const avgTime = mapPerformanceMonitor.getAverageSwitchTime();

// Get cache hit rate
const hitRate = mapPerformanceMonitor.getCacheHitRate();

// Get recent metrics
const recent = mapPerformanceMonitor.getRecentMetrics(10);
```

### Development Tools
- Performance metrics logged in development mode
- Cache status visible in console
- Error tracking with detailed stack traces

## Best Practices

1. **Always use the hooks** instead of direct map manipulation
2. **Handle errors gracefully** with fallback mechanisms
3. **Monitor performance** in development and production
4. **Cache styles appropriately** to balance speed and memory
5. **Test thoroughly** with different network conditions
6. **Document changes** when adding new map styles

## Troubleshooting

### Common Issues

1. **Map not found**: Ensure `MapProvider` wraps your component tree
2. **Style loading fails**: Check network connectivity and API keys
3. **Performance issues**: Monitor cache hit rates and switch times
4. **Type errors**: Ensure proper TypeScript types are imported

### Debug Steps

1. Check browser console for error messages
2. Verify map context is properly set up
3. Monitor performance metrics
4. Test with different network conditions
5. Validate map style URLs and API keys 