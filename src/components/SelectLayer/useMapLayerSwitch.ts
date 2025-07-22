import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '@/src/types/StateType';
import { 
  getMapStyles, 
  setAdvancedBaseLayer, 
  setBaseLayer,
  isBaseLayerActive 
} from '../Map/MapUtils/map';
import { setMapStyle } from '../../actions/layers';

interface MapStyleCache {
  [key: string]: any;
}

// Extend the Map type to include the U property from mapbox-gl-utils
interface ExtendedMap extends maplibregl.Map {
  U?: {
    hide: (layerId: string) => void;
    show: (layerId: string) => void;
  };
}

export const useMapLayerSwitch = () => {
  const dispatch = useDispatch();
  const mapStyleCache = useRef<MapStyleCache>({});
  const isSwitching = useRef(false);
  
  const currentMapStyle = useSelector((state: StateType) => {
    return state.layers ? state.layers.map_style : 'base';
  });

  // Try to get map from context first, fallback to global window
  const getMap = useCallback((): ExtendedMap | null => {
    // Try to use the MapContext if available
    if ((window as any).__MAP_CONTEXT__ && (window as any).__MAP_CONTEXT__.getMap) {
      return (window as any).__MAP_CONTEXT__.getMap() as ExtendedMap | null;
    }
    // Fallback to global window approach
    return (window as any)['ddMap'] || null;
  }, []);

  const switchMapLayer = useCallback(async (layerName: string) => {
    const map = getMap();
    
    if (!map || isSwitching.current || layerName === currentMapStyle) {
      return;
    }

    try {
      isSwitching.current = true;
      
      // Map layer names to base layer types
      const layerTypeMap: { [key: string]: string } = {
        'base': 'base',
        'luchtfoto-pdok': 'satellite'
      };
      
      const targetLayerType = layerTypeMap[layerName];
      
      if (targetLayerType) {
        // Use the new efficient base layer switching
        await setAdvancedBaseLayer(map, targetLayerType, {
          opacity: 1,
          preserveOverlays: true
        });
      } else {
        // Fallback to the old method for custom layers
        const mapStyles = getMapStyles();
        const targetStyle = mapStyles[layerName === 'luchtfoto-pdok' ? 'satellite' : 'base'];
        
        // Check if we have the style cached
        if (!mapStyleCache.current[layerName]) {
          if (typeof targetStyle === 'string') {
            // Cache the fetched style
            const response = await fetch(targetStyle);
            mapStyleCache.current[layerName] = await response.json();
          } else {
            mapStyleCache.current[layerName] = targetStyle;
          }
        }

        // Apply the cached style using the new setBaseLayer function
        await setBaseLayer(map, mapStyleCache.current[layerName]);
      }
      
      // Update Redux state
      dispatch(setMapStyle(layerName));
      
    } catch (error) {
      console.error('Error switching map layer:', error);
      
      // Enhanced fallback with better error handling
      try {
        if (layerName === 'base') {
          // Try to set terrain as fallback
          await setAdvancedBaseLayer(map, 'terrain', {
            opacity: 1,
            preserveOverlays: true
          });
        } else {
          // Try to set satellite as fallback
          await setAdvancedBaseLayer(map, 'satellite', {
            opacity: 1,
            preserveOverlays: true
          });
        }
        dispatch(setMapStyle(layerName));
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Last resort: use the old show/hide method
        if (layerName === 'base') {
          map.U?.hide('luchtfoto-pdok');
        } else {
          map.U?.show(layerName);
        }
        dispatch(setMapStyle(layerName));
      }
    } finally {
      isSwitching.current = false;
    }
  }, [getMap, currentMapStyle, dispatch]);

  // New function to check if a specific layer type is active
  const isLayerActive = useCallback((layerName: string) => {
    const map = getMap();
    if (!map) return false;
    
    const layerTypeMap: { [key: string]: string } = {
      'base': 'terrain',
      'luchtfoto-pdok': 'satellite'
    };
    
    const targetLayerType = layerTypeMap[layerName];
    return targetLayerType ? isBaseLayerActive(map, targetLayerType) : false;
  }, [getMap]);

  return {
    switchMapLayer,
    currentMapStyle,
    isSwitching: isSwitching.current,
    isLayerActive
  };
}; 