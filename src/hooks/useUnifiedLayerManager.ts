import { useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../types/StateType';
import { useLayerManager } from './useLayerManager';
// Import actual layer definitions
import { layers as layerDefinitions } from '../components/Map/layers';

// Queue item type for pending operations
interface QueuedOperation {
  id: string;
  type: 'setLayerVisibility' | 'batchSetLayerVisibility' | 'setBaseLayer' | 'activateLayers' | 'addSource' | 'batchAddSources' | 'updateSourceData';
  operation: () => void;
  timestamp: number;
  retryCount: number;
}

/**
 * Unified Layer Manager Hook
 * 
 * This hook consolidates all layer management approaches into a single, consistent API.
 * It handles both traditional layer switching and ultra-fast switching transparently.
 * Includes queue-based operation handling for map readiness.
 */
export const useUnifiedLayerManager = () => {
  const dispatch = useDispatch();
  const mapRef = useRef<any>(null);
  const isSwitchingRef = useRef(false);
  const layerVisibilityCache = useRef(new Map<string, boolean>());
  
  // Queue for operations when map is not ready
  const operationQueue = useRef<QueuedOperation[]>([]);
  const isProcessingQueue = useRef(false);
  const maxRetries = 10; // Maximum retry attempts for queued operations
  const retryDelay = 100; // Delay between retries in ms

  // Get the existing layer manager
  const layerManager = useLayerManager();

  // Get map instance from global context
  const getMap = useCallback(() => {
    if (mapRef.current) return mapRef.current;
    
    // Try to get map from global context
    if ((window as any).ddMap) {
      mapRef.current = (window as any).ddMap;
      return mapRef.current;
    }
    
    // Try to get map from context
    if ((window as any).__MAP_CONTEXT__?.getMap) {
      mapRef.current = (window as any).__MAP_CONTEXT__.getMap();
      return mapRef.current;
    }
    
    return null;
  }, []);

  // Process queued operations when map becomes ready
  const processOperationQueue = useCallback(async () => {
    if (isProcessingQueue.current || operationQueue.current.length === 0) {
      return;
    }

    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      // If map is not ready, try again in a short while
      setTimeout(processOperationQueue, 100);
      return;
    }

    isProcessingQueue.current = true;
    console.log(`Processing ${operationQueue.current.length} queued operations`);

    try {
      const operations = [...operationQueue.current];
      operationQueue.current = [];

      for (const queuedOp of operations) {
        try {
          // Check if operation is still valid (not too old)
          const age = Date.now() - queuedOp.timestamp;
          if (age > 30000) { // 30 second timeout
            console.warn(`Skipping old queued operation: ${queuedOp.type} (age: ${age}ms)`);
            continue;
          }

          // Double-check map is still ready before executing
          if (!map.isStyleLoaded()) {
            console.warn(`Map became unavailable during queue processing, re-queuing operation: ${queuedOp.type}`);
            queuedOp.timestamp = Date.now();
            operationQueue.current.push(queuedOp);
            continue;
          }

          // Execute the operation
          queuedOp.operation();
          console.log(`Successfully executed queued operation: ${queuedOp.type}`);
        } catch (error) {
          console.error(`Error executing queued operation ${queuedOp.type}:`, error);
          
          // Retry if under max retries
          if (queuedOp.retryCount < maxRetries) {
            queuedOp.retryCount++;
            queuedOp.timestamp = Date.now();
            operationQueue.current.push(queuedOp);
            console.log(`Re-queued operation ${queuedOp.type} (retry ${queuedOp.retryCount}/${maxRetries})`);
          } else {
            console.error(`Max retries exceeded for operation ${queuedOp.type}`);
          }
        }
      }
    } finally {
      isProcessingQueue.current = false;
      
      // If new operations were added during processing, process them
      if (operationQueue.current.length > 0) {
        setTimeout(processOperationQueue, retryDelay);
      }
    }
  }, [getMap]);

  // Queue an operation for later execution
  const queueOperation = useCallback((type: QueuedOperation['type'], operation: () => void) => {
    const queuedOp: QueuedOperation = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      operation,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    operationQueue.current.push(queuedOp);
    // console.log(`Queued operation: ${type} (queue size: ${operationQueue.current.length})`);
    
    // Try to process queue immediately
    setTimeout(processOperationQueue, 0);
  }, [processOperationQueue]);

  // Set map instance
  const setMap = useCallback((map: any) => {
    mapRef.current = map;
    
    // When map is set, try to process any queued operations
    if (map && map.isStyleLoaded()) {
      setTimeout(processOperationQueue, 0);
    }
    
    // Add event listener for map style load completion
    if (map && typeof map.on === 'function') {
      const handleStyleLoad = () => {
        console.log('Map style loaded, processing queued operations');
        setTimeout(processOperationQueue, 0);
      };
      
      const handleStyleData = () => {
        console.log('Map style data changed, processing queued operations');
        setTimeout(processOperationQueue, 0);
      };
      
      map.on('styledata', handleStyleData);
      map.on('load', handleStyleLoad);
      
      // Store cleanup function
      map._styleLoadHandler = handleStyleLoad;
      map._styleDataHandler = handleStyleData;
    }
  }, [processOperationQueue]);

  // Wait for map to be ready with timeout
  const waitForMapReady = useCallback(async (timeoutMs: number = 5000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const map = getMap();
      if (map && map.isStyleLoaded()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return false;
  }, [getMap]);

  // Check if map is ready (synchronous version)
  const isMapReady = useCallback((): boolean => {
    const map = getMap();
    return !!(map && map.isStyleLoaded());
  }, [getMap]);

  // Unified layer visibility setter
  const setLayerVisibility = useCallback((layerId: string, visible: boolean, options: {
    useUltraFast?: boolean;
    batch?: boolean;
    skipAnimation?: boolean;
  } = {}) => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn(`Cannot set layer visibility for ${layerId}: map not ready, queuing operation`);
      
      // Queue the operation for later execution
      queueOperation('setLayerVisibility', () => {
        setLayerVisibility(layerId, visible, options);
      });
      
      return false;
    }

    const { useUltraFast = false, batch = false, skipAnimation = false } = options;

    try {
      // Check if layer exists
      const layer = map.getLayer(layerId);
      if (!layer) {
        // If trying to hide a layer that doesn't exist, that's fine - it's already hidden
        if (!visible) {
          // console.log(`Layer ${layerId} does not exist on map, but hiding is already satisfied`);
          return true;
        }
        // If trying to show a layer that doesn't exist, we need to add it first
        console.warn(`setLayerVisibility :: Layer ${layerId} does not exist on map, cannot show it`);
        return false;
      }

      // Check current visibility
      const currentVisibility = map.getLayoutProperty(layerId, 'visibility');
      const newVisibility = visible ? 'visible' : 'none';
      
      console.log('yolo', layer, currentVisibility, newVisibility);

      if (currentVisibility === newVisibility) {
        // No change needed
        return true;
      }

      // Disable interactions if using ultra-fast mode
      if (useUltraFast && skipAnimation) {
        map.dragPan.disable();
        map.scrollZoom.disable();
      }

      // Set visibility using native MapLibre method
      console.log('yolo2 VISIBILITY', layerId, newVisibility);
      map.setLayoutProperty(layerId, 'visibility', newVisibility);
      
      // Cache the visibility state
      layerVisibilityCache.current.set(layerId, visible);
      
      // Re-enable interactions if using ultra-fast mode
      if (useUltraFast && skipAnimation) {
        map.dragPan.enable();
        map.scrollZoom.enable();
      }

      // console.log(`Layer ${layerId} visibility set to ${newVisibility} (ultra-fast: ${useUltraFast})`);
      return true;
    } catch (error) {
      console.error(`Error setting layer visibility for ${layerId}:`, error);
      
      // Fallback to mapbox-gl-utils if available
      try {
        if (map.U) {
          if (visible) {
            map.U.show(layerId);
          } else {
            map.U.hide(layerId);
          }
          // console.log(`Layer ${layerId} visibility set with fallback (ultra-fast: ${useUltraFast})`);
          return true;
        }
      } catch (fallbackError) {
        console.error(`Fallback error for layer ${layerId}:`, fallbackError);
      }
      
      return false;
    }
  }, [getMap, queueOperation]);

  // Batch layer operations
  const batchSetLayerVisibility = useCallback(async (operations: Array<{
    layerId: string;
    visible: boolean;
  }>, options: {
    useUltraFast?: boolean;
    skipAnimation?: boolean;
  } = {}) => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn('Cannot batch set layer visibility: map not ready, queuing operation');
      
      // Queue the operation for later execution
      queueOperation('batchSetLayerVisibility', async () => {
        await batchSetLayerVisibility(operations, options);
      });
      
      return;
    }
    else {
      // console.log('Map is ready for batchSetLayerVisibility');
    }

    const { useUltraFast = false, skipAnimation = false } = options;

    // Disable interactions if using ultra-fast mode
    if (useUltraFast && skipAnimation) {
      map.dragPan.disable();
      map.scrollZoom.disable();
    }

    // console.log('batchSetLayerVisibility: Operations:', operations);

    // Group operations by visibility to minimize state changes
    const visibleLayers = operations.filter(op => op.visible).map(op => op.layerId);
    const hiddenLayers = operations.filter(op => !op.visible).map(op => op.layerId);

    // console.log(`batchSetLayerVisibility: Operations:`, {
    //   total: operations.length,
    //   toShow: visibleLayers,
    //   toHide: hiddenLayers
    // });

          // Apply all visibility changes in a single batch
      try {
        // Apply all visibility changes at once
        const visibleResults = await Promise.all(visibleLayers.map(async layerId => {
          try {
            let layer = map.getLayer(layerId);
            
            // If layer doesn't exist, try to add it automatically
            if (!layer) {
              console.log(`batchSetLayerVisibility :: Layer ${layerId} does not exist on map, attempting to add it`);
              
              // Get layer definition and source
              const layerDefinition = layerDefinitions[layerId];
              const layerConfig = layerManager.allLayers[layerId];
              
              if (!layerDefinition) {
                console.warn(`batchSetLayerVisibility :: No layer definition found for ${layerId}`);
                return false;
              }
              
              // Check if source exists, add if not
              const sourceId = layerDefinition.source;
              if (sourceId && !map.getSource(sourceId)) {
                try {
                  // Import sources dynamically
                  const { sources } = await import('../components/Map/sources');
                  const sourceConfig = sources[sourceId];
                  
                  if (sourceConfig) {
                    map.addSource(sourceId, sourceConfig);
                    console.log(`batchSetLayerVisibility :: Added source ${sourceId} for layer ${layerId}`);
                  } else {
                    console.warn(`batchSetLayerVisibility :: No source configuration found for ${sourceId}`);
                    return false;
                  }
                } catch (error) {
                  console.error(`batchSetLayerVisibility :: Error adding source ${sourceId}:`, error);
                  return false;
                }
              }
              
              // Add the layer
              try {
                map.addLayer(layerDefinition);
                console.log(`batchSetLayerVisibility :: Successfully added layer ${layerId}`);
                layer = map.getLayer(layerId); // Get the newly added layer
              } catch (error) {
                console.error(`batchSetLayerVisibility :: Error adding layer ${layerId}:`, error);
                return false;
              }
            }
            
            const currentVisibility = map.getLayoutProperty(layerId, 'visibility');
            const newVisibility = 'visible';
            
            if (currentVisibility === newVisibility) {
              return true; // No change needed
            }
            
            map.setLayoutProperty(layerId, 'visibility', newVisibility);
            layerVisibilityCache.current.set(layerId, true);
            return true;
          } catch (error) {
            console.error(`Error showing layer ${layerId}:`, error);
            return false;
          }
        }));

        const hiddenResults = hiddenLayers.map(layerId => {
          try {
            const layer = map.getLayer(layerId);
            if (!layer) {
              return true; // Layer doesn't exist, so it's already hidden
            }
            
            const currentVisibility = map.getLayoutProperty(layerId, 'visibility');
            const newVisibility = 'none';
            
            if (currentVisibility === newVisibility) {
              return true; // No change needed
            }
            
            map.setLayoutProperty(layerId, 'visibility', newVisibility);
            layerVisibilityCache.current.set(layerId, false);
            return true;
          } catch (error) {
            console.error(`Error hiding layer ${layerId}:`, error);
            return false;
          }
        });

        const allResults = {
          visible: visibleResults,
          hidden: hiddenResults
        };

        // console.log('yolo3 results', allResults);

      // Re-enable interactions if using ultra-fast mode
      if (useUltraFast && skipAnimation) {
        map.dragPan.enable();
        map.scrollZoom.enable();
      }

      // console.log(`Batch layer operations completed: ${visibleLayers.length} shown, ${hiddenLayers.length} hidden`);
      return allResults;
    } catch (error) {
      console.error('Error in batch layer operations:', error);
      
      // Re-enable interactions if using ultra-fast mode
      if (useUltraFast && skipAnimation) {
        map.dragPan.enable();
        map.scrollZoom.enable();
      }
      
      return { visible: [], hidden: [] };
    }
  }, [getMap, queueOperation]);

  // Unified base layer setter
  const setBaseLayerUnified = useCallback(async (baseLayer: 'base' | 'satellite' | 'hybrid', options: {
    useUltraFast?: boolean;
    skipAnimation?: boolean;
    batch?: boolean;
  } = {}) => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn('Cannot set base layer: map not ready, queuing operation');
      
      // Queue the operation for later execution
      queueOperation('setBaseLayer', async () => {
        await setBaseLayerUnified(baseLayer, options);
      });
      
      return;
    }

    const { useUltraFast = false, skipAnimation = true, batch = true } = options;

    // Prevent concurrent switching
    if (isSwitchingRef.current) {
      console.warn('Base layer switch already in progress');
      return;
    }

    isSwitchingRef.current = true;
    const startTime = performance.now();

    try {
      // Update Redux state immediately for UI responsiveness
      dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: baseLayer });

      // Define base layer visibility rules
      const baseLayerConfig = {
        base: {
          show: ['base-layer'],
          hide: ['satellite-layer', 'hybrid-layer', 'luchtfoto-pdok']
        },
        satellite: {
          show: ['satellite-layer', 'luchtfoto-pdok'],
          hide: ['base-layer', 'hybrid-layer']
        },
        hybrid: {
          show: ['hybrid-layer', 'luchtfoto-pdok'],
          hide: ['base-layer', 'satellite-layer']
        }
      };

      const config = baseLayerConfig[baseLayer];
      if (!config) {
        console.error(`Unknown base layer style: ${baseLayer}`);
        return;
      }

      // Create batch operations
      const operations = [
        ...config.show.map(layerId => ({ layerId, visible: true })),
        ...config.hide.map(layerId => ({ layerId, visible: false }))
      ];

      // Apply base layer changes
      await batchSetLayerVisibility(operations, { useUltraFast, skipAnimation });

      // Track performance
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      // console.log(`⚡ Base layer switch to ${baseLayer} took ${switchTime.toFixed(1)}ms (ultra-fast: ${useUltraFast})`);

      // Trigger data layer re-activation after base layer switch
      setTimeout(() => {
        if (map && map.isStyleLoaded()) {
          // console.log('Triggering data layer re-activation after base layer switch');
          dispatch({ type: 'LAYER_REACTIVATE_DATA_LAYERS', payload: { timestamp: Date.now() } });
        }
      }, 100);

    } catch (error) {
      console.error('Error switching base layer:', error);
    } finally {
      isSwitchingRef.current = false;
    }
  }, [dispatch, getMap, batchSetLayerVisibility, queueOperation]);

  // Unified zones toggle
  const toggleZonesUnified = useCallback(async (options: {
    useUltraFast?: boolean;
    skipAnimation?: boolean;
  } = {}) => {
    const map = getMap();
    const { useUltraFast = false, skipAnimation = false } = options;

    // Get current zones visibility
    const zonesLayers = ['zones-geodata', 'zones-geodata-border'];
    let currentZonesVisible = false;

    if (map && map.isStyleLoaded()) {
      try {
        currentZonesVisible = map.getLayoutProperty('zones-geodata', 'visibility') === 'visible';
      } catch (error) {
        // Fallback to Redux state
        currentZonesVisible = layerManager.currentState.zonesVisible;
      }
    } else {
      // Fallback to Redux state
      currentZonesVisible = layerManager.currentState.zonesVisible;
    }

    const newZonesVisible = !currentZonesVisible;

    // Update Redux state immediately
    dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null });

    // Immediately toggle layer visibility for instant feedback
    if (map && map.isStyleLoaded()) {
      const operations = zonesLayers.map(layerId => ({
        layerId,
        visible: newZonesVisible
      }));

      await batchSetLayerVisibility(operations, { useUltraFast, skipAnimation });
    }

    // If zones are becoming visible and user is logged in, trigger zones data loading
    if (newZonesVisible) {
      console.log('Zones becoming visible, dispatching thunk action');
      dispatch(async (dispatch: any, getState: any) => {
        try {
          const { updateZonesgeodata } = await import('../poll-api/metadataZonesgeodata');
          const store = { getState, dispatch };
          updateZonesgeodata(store);
        } catch (error) {
          console.error('Failed to load zones data:', error);
        }
      });
    }

    console.log(`Zones visibility toggled to: ${newZonesVisible} (ultra-fast: ${useUltraFast})`);
  }, [dispatch, getMap, batchSetLayerVisibility, layerManager]);

  // Unified layer activation (replaces the old activateLayers function)
  const activateLayersUnified = useCallback(async (layerIds: string[], options: {
    useUltraFast?: boolean;
    skipAnimation?: boolean;
    preserveExisting?: boolean;
  } = {}) => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn('Cannot activate layers: map not ready, queuing operation');
      
      // Queue the operation for later execution
      queueOperation('activateLayers', async () => {
        await activateLayersUnified(layerIds, options);
      });
      
      return;
    }

    const { useUltraFast = false, skipAnimation = false, preserveExisting = false } = options;

    // Get all available layers from the layer manager (for metadata)
    const allLayers = layerManager.allLayers;
    const allLayerIds = Object.keys(allLayers);

    // Create operations for all layers
    const operations: Array<{ layerId: string; visible: boolean }> = [];

    // Add layers to show
    layerIds.forEach(layerId => {
      const layerConfig = allLayers[layerId];
      const layerDefinition = layerDefinitions[layerId];
      
      // console.log(`activateLayersUnified: Processing layer ${layerId}:`, {
      //   hasConfig: !!layerConfig,
      //   hasDefinition: !!layerDefinition,
      //   layerExists: !!map.getLayer(layerId)
      // });
      
      if (layerConfig && layerDefinition) {
        // Check if layer exists on map, add if not
        if (!map.getLayer(layerId)) {
          try {
            map.addLayer(layerDefinition);
            console.log(`Added missing layer: ${layerId}`);
          } catch (error) {
            console.error(`Error adding layer ${layerId}:`, error);
            return; // Skip this layer
          }
        }

        // Only activate if not a background layer
        if (!layerConfig['is-background-layer']) {
          operations.push({ layerId, visible: true });
          // console.log(`activateLayersUnified: Added ${layerId} to show operations`);
        } else {
          // console.log(`activateLayersUnified: Skipping ${layerId} - it's a background layer`);
        }
      } else {
        console.warn(`Layer ${layerId} not found in configuration or definitions`);
      }
    });

    // Add layers to hide (unless preserving existing)
    if (!preserveExisting) {
      allLayerIds.forEach(layerId => {
        if (!layerIds.includes(layerId)) {
          const layerConfig = allLayers[layerId];
          if (layerConfig && !layerConfig['is-background-layer']) {
            operations.push({ layerId, visible: false });
          }
        }
      });
    }

    // Apply all operations
          await batchSetLayerVisibility(operations, { useUltraFast, skipAnimation });

    // console.log(`Activated layers: ${layerIds.join(', ')} (ultra-fast: ${useUltraFast})`);
  }, [getMap, layerManager, batchSetLayerVisibility, queueOperation]);

  // Get layer visibility
  const getLayerVisibility = useCallback((layerId: string): boolean | null => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      return null;
    }

    try {
      const visibility = map.getLayoutProperty(layerId, 'visibility');
      return visibility === 'visible';
    } catch (error) {
      console.error(`Error getting layer visibility for ${layerId}:`, error);
      return null;
    }
  }, [getMap]);

  // Check if layer exists on map
  const layerExists = useCallback((layerId: string): boolean => {
    const map = getMap();
    if (!map) return false;

    try {
      return !!map.getLayer(layerId);
    } catch (error) {
      return false;
    }
  }, [getMap]);

  // Add layer to map
  const addLayer = useCallback((layerId: string): boolean => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn(`Cannot add layer ${layerId}: map not ready`);
      return false;
    }

    const layerConfig = layerManager.allLayers[layerId];
    const layerDefinition = layerDefinitions[layerId];
    
    if (!layerConfig || !layerDefinition) {
      console.warn(`Layer ${layerId} not found in configuration or definitions`);
      return false;
    }

    if (layerExists(layerId)) {
      console.log(`Layer ${layerId} already exists on map`);
      return true;
    }

    try {
      map.addLayer(layerDefinition);
      console.log(`Successfully added layer: ${layerId}`);
      return true;
    } catch (error) {
      console.error(`Error adding layer ${layerId}:`, error);
      return false;
    }
  }, [getMap, layerManager, layerExists]);

  // Remove layer from map
  const removeLayer = useCallback((layerId: string): boolean => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn(`Cannot remove layer ${layerId}: map not ready`);
      return false;
    }

    if (!layerExists(layerId)) {
      console.log(`removeLayer :: Layer ${layerId} does not exist on map`);
      return true;
    }

    try {
      map.removeLayer(layerId);
      console.log(`Successfully removed layer: ${layerId}`);
      return true;
    } catch (error) {
      console.error(`Error removing layer ${layerId}:`, error);
      return false;
    }
  }, [getMap, layerExists]);

  // Source management
  const addSource = useCallback((sourceId: string, sourceConfig: any): boolean => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn(`Cannot add source ${sourceId}: map not ready, queuing operation`);
      
      // Queue the operation for later execution
      queueOperation('addSource', () => {
        addSource(sourceId, sourceConfig);
      });
      
      return false;
    }

    try {
      // Check if source already exists
      const existingSource = map.getSource(sourceId);
      if (existingSource) {
        console.log(`Source ${sourceId} already exists, skipping`);
        return true;
      }

      // Add source using native MapLibre method
      map.addSource(sourceId, sourceConfig);
      console.log(`Successfully added source: ${sourceId}`);
      return true;
    } catch (error) {
      console.error(`Error adding source ${sourceId}:`, error);
      return false;
    }
  }, [getMap, queueOperation]);

  // Batch add sources
  const batchAddSources = useCallback((sources: Array<{ id: string; config: any }>, options: {
    useUltraFast?: boolean;
    skipAnimation?: boolean;
  } = {}) => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn('Cannot batch add sources: map not ready, queuing operation');
      
      // Queue the operation for later execution
      queueOperation('batchAddSources', () => {
        batchAddSources(sources, options);
      });
      
      return;
    }

    const { useUltraFast = false, skipAnimation = false } = options;

    // Disable interactions if using ultra-fast mode
    if (useUltraFast && skipAnimation) {
      map.dragPan.disable();
      map.scrollZoom.disable();
    }

    console.log(`Batch adding ${sources.length} sources`);

    try {
      const results = sources.map(({ id, config }) => {
        try {
          // Check if source already exists
          const existingSource = map.getSource(id);
          if (existingSource) {
            console.log(`Source ${id} already exists, skipping`);
            return { id, success: true, skipped: true };
          }

          // Add source
          map.addSource(id, config);
          console.log(`Successfully added source: ${id}`);
          return { id, success: true, skipped: false };
        } catch (error) {
          console.error(`Error adding source ${id}:`, error);
          return { id, success: false, error };
        }
      });

      // Re-enable interactions if using ultra-fast mode
      if (useUltraFast && skipAnimation) {
        map.dragPan.enable();
        map.scrollZoom.enable();
      }

      console.log(`Batch source operations completed:`, results);
      return results;
    } catch (error) {
      console.error('Error in batch source operations:', error);
      
      // Re-enable interactions if using ultra-fast mode
      if (useUltraFast && skipAnimation) {
        map.dragPan.enable();
        map.scrollZoom.enable();
      }
      
      return [];
    }
  }, [getMap, queueOperation]);

  // Check if source exists
  const sourceExists = useCallback((sourceId: string): boolean => {
    const map = getMap();
    if (!map) return false;

    try {
      return !!map.getSource(sourceId);
    } catch (error) {
      return false;
    }
  }, [getMap]);

  // Remove source from map
  const removeSource = useCallback((sourceId: string): boolean => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn(`Cannot remove source ${sourceId}: map not ready`);
      return false;
    }

    if (!sourceExists(sourceId)) {
      console.log(`removeSource :: Source ${sourceId} does not exist on map`);
      return true;
    }

    try {
      map.removeSource(sourceId);
      console.log(`Successfully removed source: ${sourceId}`);
      return true;
    } catch (error) {
      console.error(`Error removing source ${sourceId}:`, error);
      return false;
    }
  }, [getMap, sourceExists]);

  // Update source data
  const updateSourceData = useCallback((sourceId: string, data: any): boolean => {
    const map = getMap();
    if (!map || !map.isStyleLoaded()) {
      console.warn(`Cannot update source data for ${sourceId}: map not ready, queuing operation`);
      
      // Queue the operation for later execution
      queueOperation('updateSourceData', () => {
        updateSourceData(sourceId, data);
      });
      
      return false;
    }

    try {
      const source = map.getSource(sourceId);
      if (!source) {
        console.warn(`Source ${sourceId} does not exist, cannot update data`);
        return false;
      }

      if (source.setData) {
        source.setData(data);
        // console.log(`Successffully updated source data: ${sourceId}`);
        return true;
      } else {
        console.warn(`Source ${sourceId} does not support setData method`);
        return false;
      }
    } catch (error) {
      console.error(`Error updating source data for ${sourceId}:`, error);
      return false;
    }
  }, [getMap, queueOperation]);

  // Get switching status
  const isSwitching = useMemo(() => isSwitchingRef.current, []);

  return {
    // Map management
    getMap,
    setMap,
    
    // Layer visibility
    setLayerVisibility,
    batchSetLayerVisibility,
    getLayerVisibility,
    
    // Layer management
    addLayer,
    removeLayer,
    layerExists,
    activateLayers: activateLayersUnified,
    
    // Source management
    addSource,
    batchAddSources,
    sourceExists,
    removeSource,
    updateSourceData,
    
    // High-level operations
    setBaseLayer: setBaseLayerUnified,
    toggleZones: toggleZonesUnified,
    
    // Status
    isSwitching,
    isMapReady,
    
    // Delegate to existing layer manager for state management (excluding conflicting methods)
    currentState: layerManager.currentState,
    allLayers: layerManager.allLayers,
    allPresets: layerManager.allPresets,
    getLayersByCategory: layerManager.getLayersByCategory,
    getPresetsByCategory: layerManager.getPresetsByCategory,
    getActiveLayers: layerManager.getActiveLayers,
    getActiveSources: layerManager.getActiveSources,
    isLayerVisible: layerManager.isLayerVisible,
    isPresetActive: layerManager.isPresetActive,
    getCurrentDisplayMode: layerManager.getCurrentDisplayMode,
    getCurrentParkView: layerManager.getCurrentParkView,
    getCurrentRentalsView: layerManager.getCurrentRentalsView,
    setDisplayMode: layerManager.setDisplayMode,
    setParkView: layerManager.setParkView,
    setRentalsView: layerManager.setRentalsView
  };
};