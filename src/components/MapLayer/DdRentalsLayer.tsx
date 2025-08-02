import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useBackgroundLayer } from '../Map/MapUtils/useBackgroundLayer';
import { StateType } from '../../types/StateType';

const DdRentalsLayer = ({
  map
}): JSX.Element => {
  const { setLayer } = useBackgroundLayer(map);
  
  // Get current map style from Redux state
  const mapStyle = useSelector((state: StateType) => {
    return state.layers ? state.layers.map_style : 'base';
  });

  // On component load: Set background layer to 'base layer' only if not already set
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    // Only set to 'base' if the current map style is not already 'base'
    if (mapStyle !== 'base') {
      setLayer('base');
    }
  }, [
    map,
    map?.U,
    document.location.pathname,
    setLayer,
    mapStyle
  ]);

  return <></>
}

export default DdRentalsLayer;
