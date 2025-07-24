import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';

const DdParkEventsLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()
  
  const mapStyle = useSelector((state: StateType) => state.layers ? state.layers.map_style : 'base');

  // Note: Base layer management is now handled by the new layer management system
  // This component no longer needs to set background layers

  return <></>
}

export default DdParkEventsLayer;
