import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { 
  setDataLayer, 
  unsetDataLayer, 
  toggleDataLayer, 
  setSingleDataLayer,
  getAvailableDataLayers,
  getCurrentDataLayers 
} from './dataLayerManager';
import { setDataLayer as setDataLayerAction, setSingleDataLayer as setSingleDataLayerAction, unsetDataLayer as unsetDataLayerAction, toggleDataLayer as toggleDataLayerAction } from '../../../actions/layers';

/**
 * React hook for managing data layers
 * 
 * @param map - The map instance
 * @returns Data layer management functions
 */
export const useDataLayer = (map: maplibregl.Map | null) => {
  const dispatch = useDispatch();

  /**
   * Set a data layer (show it)
   * 
   * @param layerName - Name of the data layer to set
   * @param displayMode - Current display mode
   * @param onSuccess - Optional success callback
   * @param onError - Optional error callback
   */
  const setLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    if (!map) {
      const error = 'Map instance is required';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    setDataLayer(
      map,
      layerName,
      displayMode,
      (layerName: string) => {
        // Update Redux state with new data layer action
        dispatch(setDataLayerAction(displayMode, layerName));
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(layerName);
        }
      },
      (error: string) => {
        console.error('Failed to set data layer:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }, [map, dispatch]);

  /**
   * Unset a data layer (hide it)
   * 
   * @param layerName - Name of the data layer to unset
   * @param displayMode - Current display mode
   * @param onSuccess - Optional success callback
   * @param onError - Optional error callback
   */
  const unsetLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    if (!map) {
      const error = 'Map instance is required';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    unsetDataLayer(
      map,
      layerName,
      displayMode,
      (layerName: string) => {
        // Update Redux state with new data layer action
        dispatch(unsetDataLayerAction(displayMode, layerName));
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(layerName);
        }
      },
      (error: string) => {
        console.error('Failed to unset data layer:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }, [map]);

  /**
   * Toggle a data layer (show if hidden, hide if shown)
   * 
   * @param layerName - Name of the data layer to toggle
   * @param displayMode - Current display mode
   * @param isVisible - Current visibility state
   * @param onSuccess - Optional success callback
   * @param onError - Optional error callback
   */
  const toggleLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    isVisible: boolean, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    if (!map) {
      const error = 'Map instance is required';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    toggleDataLayer(
      map,
      layerName,
      displayMode,
      isVisible,
      (layerName: string) => {
        // Update Redux state with new data layer action
        dispatch(toggleDataLayerAction(displayMode, layerName, isVisible));
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(layerName);
        }
      },
      (error: string) => {
        console.error('Failed to toggle data layer:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }, [map, dispatch]);

  /**
   * Get available data layers for a display mode
   */
  const getAvailableLayers = useCallback((displayMode: string) => {
    return getAvailableDataLayers(displayMode);
  }, []);

  /**
   * Set a single data layer (radio button behavior)
   * 
   * @param layerName - Name of the data layer to set
   * @param displayMode - Current display mode
   * @param onSuccess - Optional success callback
   * @param onError - Optional error callback
   */
  const setSingleLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    if (!map) {
      const error = 'Map instance is required';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    setSingleDataLayer(
      map,
      layerName,
      displayMode,
      (layerName: string) => {
        // Update Redux state with new single data layer action
        dispatch(setSingleDataLayerAction(displayMode, layerName));
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(layerName);
        }
      },
      (error: string) => {
        console.error('Failed to set single data layer:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }, [map, dispatch]);

  /**
   * Get currently active data layers for a display mode
   */
  const getCurrentLayers = useCallback((displayMode: string) => {
    return getCurrentDataLayers(map, displayMode);
  }, [map]);

  return {
    setLayer,
    unsetLayer,
    toggleLayer,
    setSingleLayer,
    getAvailableLayers,
    getCurrentLayers
  };
}; 