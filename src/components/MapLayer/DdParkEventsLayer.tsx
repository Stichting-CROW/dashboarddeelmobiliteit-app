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

  // On component load: Set background layer to 'base layer' only if no style is already set
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    // Only set the background layer if the current map style is the default 'base'
    // This prevents overriding the user's persisted preference
    if (mapStyle === 'base') {
      console.log('DdParkEventsLayer: Setting base layer as default');
      setBackgroundLayer(map, 'base', setMapStyle);
    } else {
      console.log('DdParkEventsLayer: Skipping default layer setting, current style:', mapStyle);
    }
  }, [
    map,
    map?.U,
    document.location.pathname,
    mapStyle
  ]);

  return <></>
}

export default DdParkEventsLayer;
