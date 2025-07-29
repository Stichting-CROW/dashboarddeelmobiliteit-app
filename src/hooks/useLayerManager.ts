import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../types/StateType';
import { LayerState, LayerConfig, LayerPreset } from '../types/LayerTypes';
import { 
  layerConfig, 
  getLayerById, 
  getPresetById, 
  getLayersByCategory,
  getPresetsByCategory,
  displayModeToPresetMap,
  viewModeToPresetMap
} from '../config/layerConfig';

export const useLayerManager = () => {
  const dispatch = useDispatch();
  
  // Get current layer state from Redux
  const layerState = useSelector((state: StateType) => state.layers);
  const filter = useSelector((state: StateType) => state.filter);
  const isLoggedIn = useSelector((state: StateType) => 
    state.authentication.user_data ? true : false
  );

  // Convert old state format to new format
  const currentState: LayerState = useMemo(() => {
    const displayMode = layerState?.displaymode || 'displaymode-park';
    const viewPark = layerState?.view_park || 'parkeerdata-voertuigen';
    const viewRentals = layerState?.view_rentals || 'verhuurdata-voertuigen';
    const zonesVisible = layerState?.zones_visible || false;
    const mapStyle = layerState?.map_style || 'base';
    
    // Determine active preset based on display mode and view
    let activePreset: string | null = null;
    if (displayMode === 'displaymode-park') {
      activePreset = viewModeToPresetMap.park[viewPark] || 'park-points';
    } else if (displayMode === 'displaymode-rentals') {
      const rentalsKey = (filter?.herkomstbestemming === 'bestemming' ? 'destinations' : 'origins');
      const presetKey = `rentals-${rentalsKey}-${viewRentals.replace('verhuurdata-', '')}`;
      activePreset = viewModeToPresetMap.rentals[viewRentals] || 'rentals-origins-points';
    } else {
      activePreset = displayModeToPresetMap[displayMode] || null;
    }

    // Build visible layers list
    const visibleLayers: string[] = [];
    
    // Always include isochrones
    visibleLayers.push('zones-isochrones');
    
    // Add zones if visible and user is logged in
    if (zonesVisible && isLoggedIn) {
      visibleLayers.push('zones-geodata', 'zones-geodata-border');
    }
    
    // Add preset layers
    if (activePreset) {
      const preset = getPresetById(activePreset);
      if (preset) {
        visibleLayers.push(...preset.layers);
      } else {
        console.warn('useLayerManager: No preset found for', activePreset);
      }
    } else {
      console.warn('useLayerManager: No active preset determined');
    }

    return {
      visibleLayers,
      hiddenLayers: [], // Not tracked in old system
      activeSources: [], // Not tracked in old system
      baseLayer: mapStyle,
      zonesVisible: zonesVisible,
      displayMode: displayMode,
      parkView: viewPark,
      rentalsView: viewRentals
    };
  }, [
    // Only depend on the specific properties that affect layer visibility
    layerState?.displaymode,
    layerState?.view_park,
    layerState?.view_rentals,
    layerState?.zones_visible,
    layerState?.map_style,
    filter?.herkomstbestemming,
    isLoggedIn
  ]);

  // Get all available layers
  const allLayers = useMemo(() => layerConfig.layers, []);

  // Get all available presets
  const allPresets = useMemo(() => layerConfig.presets, []);

  // Get layers by category
  const getLayersByCategory = useCallback((category: string) => {
    return Object.values(allLayers).filter(layer => layer.category === category);
  }, [allLayers]);

  // Get presets by category
  const getPresetsByCategory = useCallback((category: string) => {
    return allPresets.filter(preset => preset.category === category);
  }, [allPresets]);

  // Set base layer
  const setBaseLayer = useCallback((baseLayer: 'base' | 'satellite' | 'hybrid') => {
    dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: baseLayer });
  }, [dispatch]);

  // Toggle zones visibility
  const toggleZones = useCallback(() => {
    const newZonesVisible = !layerState?.zones_visible;
    
    dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null });
    
    // If zones are becoming visible and user is logged in, trigger zones data loading
    if (newZonesVisible && isLoggedIn) {
      dispatch(async (dispatch, getState) => {
        try {
          const { updateZonesgeodata } = await import('../poll-api/metadataZonesgeodata');
          const store = { getState, dispatch };
          updateZonesgeodata(store);
        } catch (error) {
          console.error('Failed to load zones data:', error);
        }
      });
    }
  }, [dispatch, layerState?.zones_visible, isLoggedIn]);

  // Set display mode (converts to preset)
  const setDisplayMode = useCallback((displayMode: string) => {
    dispatch({ type: 'LAYER_SET_DISPLAYMODE', payload: displayMode });
  }, [dispatch]);

  // Set view mode for park
  const setParkView = useCallback((viewMode: string) => {
    dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: viewMode });
  }, [dispatch]);

  // Set view mode for rentals
  const setRentalsView = useCallback((viewMode: string) => {
    dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: viewMode });
  }, [dispatch]);

  // Get active layers for MapComponent
  const getActiveLayers = useCallback(() => {
    return currentState.visibleLayers;
  }, [currentState.visibleLayers]);

  // Get active sources for MapComponent
  const getActiveSources = useCallback(() => {
    const sources: string[] = [];
    
    currentState.visibleLayers.forEach(layerId => {
      const layer = getLayerById(layerId);
      if (layer?.source) {
        sources.push(layer.source);
      }
    });

    const uniqueSources = Array.from(new Set(sources)); // Remove duplicates
    return uniqueSources;
  }, [currentState.visibleLayers]);

  // Check if a layer is visible
  const isLayerVisible = useCallback((layerId: string) => {
    return currentState.visibleLayers.includes(layerId);
  }, [currentState.visibleLayers]);

  // Check if a preset is active
  const isPresetActive = useCallback((presetId: string) => {
    // Determine active preset based on current state
    const displayMode = currentState.displayMode;
    const parkView = currentState.parkView;
    const rentalsView = currentState.rentalsView;
    
    if (displayMode === 'displaymode-park') {
      const expectedPreset = viewModeToPresetMap.park[parkView];
      return expectedPreset === presetId;
    } else if (displayMode === 'displaymode-rentals') {
      const expectedPreset = viewModeToPresetMap.rentals[rentalsView];
      return expectedPreset === presetId;
    } else {
      const expectedPreset = displayModeToPresetMap[displayMode];
      return expectedPreset === presetId;
    }
  }, [currentState.displayMode, currentState.parkView, currentState.rentalsView]);

  // Get current display mode
  const getCurrentDisplayMode = useCallback(() => {
    return layerState?.displaymode || 'displaymode-park';
  }, [layerState?.displaymode]);

  // Get current view mode for park
  const getCurrentParkView = useCallback(() => {
    return layerState?.view_park || 'parkeerdata-voertuigen';
  }, [layerState?.view_park]);

  // Get current view mode for rentals
  const getCurrentRentalsView = useCallback(() => {
    return layerState?.view_rentals || 'verhuurdata-voertuigen';
  }, [layerState?.view_rentals]);

  return {
    // State
    currentState,
    allLayers,
    allPresets,
    
    // Getters
    getLayersByCategory,
    getPresetsByCategory,
    getActiveLayers,
    getActiveSources,
    isLayerVisible,
    isPresetActive,
    getCurrentDisplayMode,
    getCurrentParkView,
    getCurrentRentalsView,
    
    // Actions
    setBaseLayer,
    toggleZones,
    setDisplayMode,
    setParkView,
    setRentalsView
  };
}; 