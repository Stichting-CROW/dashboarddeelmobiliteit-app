import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMapStyles, applyMapStyle, setBackgroundLayer } from '../Map/MapUtils/map';
import { setMapStyle } from '../../actions/layers';

const DdParkEventsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()

  // On component load: Set background layer to 'base layer'
  useEffect(() => {
    if(! map) return;
    if(! map.U) return;

    setBackgroundLayer(map, 'base', setMapStyle);
  }, [
    map,
    map?.U,
    document.location.pathname
  ]);

  return <></>
}

export default DdParkEventsLayer;
