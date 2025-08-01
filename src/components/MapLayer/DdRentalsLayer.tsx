import { useEffect } from 'react';
import { useBackgroundLayer } from '../Map/MapUtils/useBackgroundLayer';

const DdRentalsLayer = ({
  map
}): JSX.Element => {
  const { setLayer } = useBackgroundLayer(map);

  // On component load: Set background layer to 'base layer'
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    console.log('DdRentalsLayer useEffect');
    const defaultLayerName = 'base';
    
    // Use the new hook for cleaner background layer management
    setLayer(defaultLayerName);
  }, [
    map,
    map?.U,
    document.location.pathname,
    setLayer
  ]);

  return <></>
}

export default DdRentalsLayer;
