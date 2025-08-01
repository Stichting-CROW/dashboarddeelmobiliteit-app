import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setBackgroundLayer, getAvailableBackgroundLayers } from './backgroundLayerManager';
import { setMapStyle } from '../../../actions/layers';

/**
 * React hook for managing background layers
 * 
 * @param {Object} map - The map instance
 * @returns {Object} - Background layer management functions
 */
export const useBackgroundLayer = (map) => {
  const dispatch = useDispatch();

  /**
   * Set the background layer
   * 
   * @param {string} layerName - Name of the background layer to set
   * @param {Function} onSuccess - Optional success callback
   * @param {Function} onError - Optional error callback
   */
  const setLayer = useCallback((layerName, onSuccess = null, onError = null) => {
    if (!map) {
      const error = 'Map instance is required';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    setBackgroundLayer(
      map,
      layerName,
      (layerName) => {
        // Update Redux state
        dispatch(setMapStyle(layerName));
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(layerName);
        }
      },
      (error) => {
        console.error('Failed to set background layer:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }, [map, dispatch]);

  /**
   * Get available background layers
   */
  const getAvailableLayers = useCallback(() => {
    return getAvailableBackgroundLayers();
  }, []);

  return {
    setLayer,
    getAvailableLayers
  };
}; 