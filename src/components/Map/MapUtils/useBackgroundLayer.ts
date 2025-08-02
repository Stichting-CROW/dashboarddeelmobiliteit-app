import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { setBackgroundLayer, getAvailableBackgroundLayers } from './backgroundLayerManager';
import { setMapStyle } from '../../../actions/layers';

/**
 * React hook for managing background layers
 * 
 * @param map - The map instance
 * @returns Background layer management functions
 */
export const useBackgroundLayer = (map: maplibregl.Map | null) => {
  const dispatch = useDispatch();

  /**
   * Set the background layer
   * 
   * @param layerName - Name of the background layer to set
   * @param onSuccess - Optional success callback
   * @param onError - Optional error callback
   */
  const setLayer = useCallback((layerName: string, onSuccess: ((layerName: string) => void) | null = null, onError: ((error: string) => void) | null = null) => {
    if (!map) {
      const error = 'Map instance is required';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    setBackgroundLayer(
      map,
      layerName,
      (layerName: string) => {
        // Update Redux state
        dispatch(setMapStyle(layerName));
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(layerName);
        }
      },
      (error: string) => {
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