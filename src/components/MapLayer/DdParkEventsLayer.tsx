import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMapStyles, setMapStyle } from '../Map/MapUtils/map';
import {
  activateLayers
} from '../Map/MapUtils/layers.js';

const DdParkEventsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()

  // On component load: Set base view
  const mapStyles = getMapStyles();
  useEffect(() => {
    if(! map) return;

    // If map was already loaded:
    if(map.isStyleLoaded()) {
      setTimeout(() => {
        dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'default' })
        setMapStyle(map, mapStyles.base)
      }, 250);
    }

    // If map wasn't loaded, wait on full map load:
    map.on('load', function() {
      dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'default' })
      setMapStyle(map, mapStyles.base)
    });
  }, [
    map,
    document.location.pathname
  ]);

  return <></>
}

export default DdParkEventsLayer;
