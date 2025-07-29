import { useCallback, useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../types/StateType';
import { LayerService } from '../services/LayerService';
import { LayerConfig, SourceConfig, LayerOperationOptions, LayerState } from '../types/LayerTypes';
import { layers as layerDefinitions } from '../components/Map/layers';
import { sources as sourceDefinitions } from '../components/Map/sources';

/**
 * New Layer Manager Hook using the improved LayerService
 */
export const useNewLayerManager = () => {
  const dispatch = useDispatch();
  const layerServiceRef = useRef<LayerService | null>(null);
  const mapRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentState, setCurrentState] = useState<LayerState>({
    visibleLayers: [],
    hiddenLayers: [],
    activeSources: [],
    baseLayer: 'base',
    zonesVisible: false,
    displayMode: 'park',
    parkView: 'points',
    rentalsView: 'points'
  });

  // Get Redux state
  const layerState = useSelector((state: StateType) => state.layers);
  const filter = useSelector((state: StateType) => state.filter);
  const isLoggedIn = useSelector((state: StateType) => state.authentication.isLoggedIn);

  // Initialize layer service
  useEffect(() => {
    if (!layerServiceRef.current) {
      layerServiceRef.current = new LayerService();
    }
  }, []);

  // Set map instance
  const setMap = useCallback((map: any) => {
    mapRef.current = map;
    
    if (layerServiceRef.current && map) {
      layerServiceRef.current.initialize(map);
      
      // Register layers and sources from configuration
      const layerConfigs: Record<string, LayerConfig> = {};
      const sourceConfigs: Record<string, SourceConfig> = {};

      // Convert existing layer definitions to new format
      Object.entries(layerDefinitions).forEach(([id, def]) => {
        const layerDef = def as any;
        layerConfigs[id] = {
          id,
          name: layerDef.name || id,
          type: 'data',
          category: layerDef.category || 'data',
          source: def.source,
          visible: false,
          order: layerDef.order || 10,
          description: layerDef.description,
          isBackgroundLayer: layerDef['is-background-layer'] || false
        };
      });

      // Convert existing source definitions to new format
      Object.entries(sourceDefinitions).forEach(([id, def]) => {
        sourceConfigs[id] = {
          id,
          type: (def.type as any) || 'geojson',
          data: def.data,
          url: def.url,
          tiles: def.tiles,
          cluster: def.cluster,
          clusterRadius: def.clusterRadius,
          clusterMaxZoom: def.clusterMaxZoom,
          attribution: def.attribution,
          tileSize: def.tileSize
        };
      });

      layerServiceRef.current.registerFromConfig(layerConfigs, sourceConfigs);
      setIsInitialized(true);
    }
  }, []);

  // Set layer visibility
  const setLayerVisibility = useCallback(async (
    layerId: string, 
    visible: boolean, 
    options: LayerOperationOptions = {}
  ) => {
    if (!layerServiceRef.current || !isInitialized) {
      console.warn('Layer service not initialized');
      return { success: false, layerId, error: 'Service not initialized' };
    }

    const result = await layerServiceRef.current.setLayerVisibility(layerId, visible, options);
    
    if (result.success) {
      // Update local state
      setCurrentState(prev => ({
        ...prev,
        visibleLayers: visible 
          ? [...prev.visibleLayers, layerId]
          : prev.visibleLayers.filter(id => id !== layerId),
        hiddenLayers: visible
          ? prev.hiddenLayers.filter(id => id !== layerId)
          : [...prev.hiddenLayers, layerId]
      }));
    }

    return result;
  }, [isInitialized]);

  // Batch set layer visibility
  const batchSetLayerVisibility = useCallback(async (
    operations: Array<{ layerId: string; visible: boolean }>,
    options: LayerOperationOptions = {}
  ) => {
    if (!layerServiceRef.current || !isInitialized) {
      console.warn('Layer service not initialized');
      return { success: false, results: [], summary: { total: 0, successful: 0, failed: 0, warnings: 0 } };
    }

    const result = await layerServiceRef.current.batchSetLayerVisibility(operations, options);
    
    if (result.success) {
      // Update local state
      setCurrentState(prev => {
        const newState = { ...prev };
        operations.forEach(op => {
          if (op.visible) {
            if (!newState.visibleLayers.includes(op.layerId)) {
              newState.visibleLayers.push(op.layerId);
            }
            newState.hiddenLayers = newState.hiddenLayers.filter(id => id !== op.layerId);
          } else {
            if (!newState.hiddenLayers.includes(op.layerId)) {
              newState.hiddenLayers.push(op.layerId);
            }
            newState.visibleLayers = newState.visibleLayers.filter(id => id !== op.layerId);
          }
        });
        return newState;
      });
    }

    return result;
  }, [isInitialized]);

  // Set base layer
  const setBaseLayer = useCallback(async (baseLayer: 'base' | 'satellite' | 'hybrid') => {
    if (!layerServiceRef.current || !isInitialized) {
      console.warn('Layer service not initialized');
      return;
    }

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
    await batchSetLayerVisibility(operations, { useUltraFast: true, skipAnimation: true });

    // Update local state
    setCurrentState(prev => ({ ...prev, baseLayer }));
  }, [dispatch, batchSetLayerVisibility, isInitialized]);

  // Toggle zones
  const toggleZones = useCallback(async () => {
    if (!layerServiceRef.current || !isInitialized) {
      console.warn('Layer service not initialized');
      return;
    }

    const newZonesVisible = !currentState.zonesVisible;
    
    // Update Redux state immediately
    dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null });

    // Toggle zones layers
    const zonesLayers = ['zones-geodata', 'zones-geodata-border'];
    const operations = zonesLayers.map(layerId => ({
      layerId,
      visible: newZonesVisible
    }));

    await batchSetLayerVisibility(operations, { useUltraFast: true, skipAnimation: true });

    // Update local state
    setCurrentState(prev => ({ ...prev, zonesVisible: newZonesVisible }));

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
  }, [dispatch, batchSetLayerVisibility, currentState.zonesVisible, isInitialized]);

  // Get layer visibility
  const getLayerVisibility = useCallback((layerId: string): boolean | null => {
    if (!mapRef.current) return null;

    try {
      const visibility = mapRef.current.getLayoutProperty(layerId, 'visibility');
      return visibility === 'visible';
    } catch (error) {
      console.error(`Error getting layer visibility for ${layerId}:`, error);
      return null;
    }
  }, []);

  // Check if layer exists
  const layerExists = useCallback((layerId: string): boolean => {
    if (!mapRef.current) return false;

    try {
      return !!mapRef.current.getLayer(layerId);
    } catch (error) {
      return false;
    }
  }, []);

  // Validate state
  const validateState = useCallback(async () => {
    if (!layerServiceRef.current) return null;
    return await layerServiceRef.current.validateState();
  }, []);

  // Get performance stats
  const getPerformanceStats = useCallback(() => {
    if (!layerServiceRef.current) return null;
    return layerServiceRef.current.getPerformanceStats();
  }, []);

  // Get queue status
  const getQueueStatus = useCallback(() => {
    if (!layerServiceRef.current) return null;
    return layerServiceRef.current.getQueueStatus();
  }, []);

  return {
    // Map management
    setMap,
    
    // Layer visibility
    setLayerVisibility,
    batchSetLayerVisibility,
    getLayerVisibility,
    
    // Layer management
    layerExists,
    
    // High-level operations
    setBaseLayer,
    toggleZones,
    
    // State and validation
    currentState,
    validateState,
    getPerformanceStats,
    getQueueStatus,
    
    // Status
    isInitialized,
    
    // Service access (for advanced usage)
    getLayerService: () => layerServiceRef.current
  };
}; 