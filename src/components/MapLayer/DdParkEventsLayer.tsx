import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMapStyles, applyMapStyle, setBackgroundLayer } from '../Map/MapUtils/map';
import { setMapStyle } from '../../actions/layers';
import { StateType } from '../../types/StateType';

const DdParkEventsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()
  
  const mapStyle = useSelector((state: StateType) => state.layers ? state.layers.map_style : 'base');

  // On component load: Set background layer based on the current map style
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    // Set the background layer based on the current map style
    const applyMapStyle = async () => {
      try {
        const { setAdvancedBaseLayer } = await import('../Map/MapUtils/map');
        
        if (mapStyle === 'base') {
          console.log('DdParkEventsLayer: Setting base layer as default');
          await setAdvancedBaseLayer(map, 'base', {
            opacity: 1,
            preserveOverlays: true
          });
        } else if (mapStyle === 'luchtfoto-pdok') {
          console.log('DdParkEventsLayer: Setting satellite layer');
          await setAdvancedBaseLayer(map, 'satellite', {
            opacity: 1,
            preserveOverlays: true
          });
        } else if (mapStyle === 'hybrid') {
          console.log('DdParkEventsLayer: Setting hybrid layer');
          await setAdvancedBaseLayer(map, 'hybrid', {
            opacity: 1,
            preserveOverlays: true
          });
        } else {
          console.log('DdParkEventsLayer: Skipping default layer setting, current style:', mapStyle);
        }
      } catch (error) {
        console.error('DdParkEventsLayer: Failed to apply map style:', error);
        // Fallback to old method for backward compatibility
        if (mapStyle === 'base') {
          setBackgroundLayer(map, 'base', setMapStyle);
        }
      }
    };
    
    applyMapStyle();
  }, [
    map,
    map?.U,
    document.location.pathname,
    mapStyle
  ]);

  return <></>
}

export default DdParkEventsLayer;
