import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMapStyles, applyMapStyle } from '../Map/MapUtils/map';
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
      //TODO setTimeout
      applyMapStyle(map, mapStyles.base)
      dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'base' })
    }

    // If map wasn't loaded, wait on full map load:
    map.on('load', function() {
      applyMapStyle(map, mapStyles.base)
      dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'base' })
    });
  }, [
    map,
    document.location.pathname
  ]);

  return <></>
}

export default DdParkEventsLayer;
