import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {latLngToCell} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_OTHER,
} from '../../reducers/layers.js';

import {StateType} from '../../types/StateType';

import {
  renderH3Grid,
  removeH3Grid
} from '../Map/MapUtils/map.hb';

const DdH3HexagonLayer = ({
  map
}) => {
  const dispatch = useDispatch()

  const displayMode = useSelector((state: StateType) => state.layers ? state.layers.displaymode : DISPLAYMODE_PARK);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');
  const filter = useSelector((state: StateType) => state.filter || null);
  const stateLayers = useSelector((state: StateType) => state.layers || null);

  const token = useSelector((state: StateType) => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  // If HB view: Show H3 grid, if not: Remove H3 grid
  useEffect(() => {
    // Stop if map didn't load
    if(! map) return;
    // Always remove 'old' H3 grid from map first
    removeH3Grid(map);
    // Stop if no HB mode
    if(! is_hb_view) return;
    // If HB map is active: render hexagons
    renderH3Grid(map, token, filter);
  }, [
    map,
    is_hb_view,
    stateLayers.displaymode,
    filter.h3niveau,
    filter.h3hexes7.length,
    filter.h3hexes8.length,
    filter.ontwikkelingvan,
    filter.ontwikkelingtot,
    filter.timeframes,
    filter.weekdays,
    filter.herkomstbestemming,
    filter.voertuigtypesexclude,
  ]);

  // Init click handler
  useEffect(() => {
    if(! map) return;

    const didClick = (e) => {
      const coordinates = e.lngLat;

      // Convert a lat/lng point to a hexagon index at resolution 7
      const h3Index = latLngToCell(coordinates.lat, coordinates.lng, filter.h3niveau);

      // Set selected h3Index
      if(filter.h3niveau === 7) {
        dispatch({ type: 'TOGGLE_FILTER_H3HEXES_7', payload: h3Index });
      }
      else if(filter.h3niveau === 8) {
        dispatch({ type: 'TOGGLE_FILTER_H3HEXES_8', payload: h3Index });
      }
    }

    map.on('click', didClick);

    return () => {
      map.off('click', didClick);
    }
  }, [
    map,
    filter.h3niveau
  ])

}

export default DdH3HexagonLayer;
