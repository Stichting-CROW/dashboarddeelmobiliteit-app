import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useBackgroundLayer } from '../Map/MapUtils/useBackgroundLayer';
import { StateType } from '../../types/StateType';

const DdParkEventsLayer = ({
  map
}): JSX.Element => {
  const { setLayer } = useBackgroundLayer(map);
  const hasInitialized = useRef(false);
  
  // Get current map style from Redux state
  const mapStyle = useSelector((state: StateType) => {
    return state.layers ? state.layers.map_style : 'base';
  });

  // On component load: Set background layer to 'base layer' only on initial load
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;
    if(hasInitialized.current) return; // Only run once

    // Set to 'base' on initial load
    setLayer('base');
    hasInitialized.current = true;
  }, [
    map,
    map?.U,
    setLayer
  ]);

  return <></>
}

export default DdParkEventsLayer;
