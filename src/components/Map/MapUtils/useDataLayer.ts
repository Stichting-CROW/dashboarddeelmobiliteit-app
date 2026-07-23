import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
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
 * React hook for managing data layers.
 * 
 * The map layer visibility is handled by MapComponent based on the Redux state.
 * This hook only validates layer names and dispatches the corresponding actions.
 * 
 * The `map` parameter is kept for backward compatibility but is no longer used.
 * @returns Data layer management functions
 */
export const useDataLayer = (map?: unknown) => {
  const dispatch = useDispatch();

  const handleSuccess = (callback, layerName, action) => {
    if (action) dispatch(action);
    if (callback) callback(layerName);
  };

  const handleError = (callback, error) => {
    console.error('Failed to set data layer:', error);
    if (callback) callback(error);
  };

  /**
   * Set a data layer (show it)
   */
  const setLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    setDataLayer(
      null,
      layerName,
      displayMode,
      (layerName: string) => handleSuccess(onSuccess, layerName, setDataLayerAction(displayMode, layerName)),
      (error: string) => handleError(onError, error)
    );
  }, [dispatch]);

  /**
   * Unset a data layer (hide it)
   */
  const unsetLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    unsetDataLayer(
      null,
      layerName,
      displayMode,
      (layerName: string) => handleSuccess(onSuccess, layerName, unsetDataLayerAction(displayMode, layerName)),
      (error: string) => handleError(onError, error)
    );
  }, [dispatch]);

  /**
   * Toggle a data layer (show if hidden, hide if shown)
   */
  const toggleLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    isVisible: boolean, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    toggleDataLayer(
      null,
      layerName,
      displayMode,
      isVisible,
      (layerName: string) => handleSuccess(onSuccess, layerName, toggleDataLayerAction(displayMode, layerName, isVisible)),
      (error: string) => handleError(onError, error)
    );
  }, [dispatch]);

  /**
   * Get available data layers for a display mode
   */
  const getAvailableLayers = useCallback((displayMode: string) => {
    return getAvailableDataLayers(displayMode);
  }, []);

  /**
   * Set a single data layer (radio button behavior)
   */
  const setSingleLayer = useCallback((
    layerName: string, 
    displayMode: string, 
    onSuccess: ((layerName: string) => void) | null = null, 
    onError: ((error: string) => void) | null = null
  ) => {
    setSingleDataLayer(
      null,
      layerName,
      displayMode,
      (layerName: string) => handleSuccess(onSuccess, layerName, setSingleDataLayerAction(displayMode, layerName)),
      (error: string) => handleError(onError, error)
    );
  }, [dispatch]);

  /**
   * Get currently active data layers for a display mode.
   * @deprecated Read active_data_layers from Redux instead.
   */
  const getCurrentLayers = useCallback((displayMode: string) => {
    return getCurrentDataLayers(null, displayMode);
  }, []);

  return {
    setLayer,
    unsetLayer,
    toggleLayer,
    setSingleLayer,
    getAvailableLayers,
    getCurrentLayers
  };
}; 
