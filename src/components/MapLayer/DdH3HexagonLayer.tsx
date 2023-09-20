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
  removeH3Grid
} from '../Map/MapUtils/map.hb';
import {
  renderGeometriesGrid
} from '../Map/MapUtils/map.hb.geometries';
import {
  renderH3Grid
} from '../Map/MapUtils/map.hb.h3';

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

  // Make sure h3hexes7 and h3hexes8 are available as array
  if(! filter.h3hexes7) filter.h3hexes7 = [];
  if(! filter.h3hexes8) filter.h3hexes8 = [];
  if(! filter.h3hexeswijk) filter.h3hexeswijk = [];

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
    // Stop if no HB mode
    if(! is_hb_view) {
      // If no HB view: remove remove 'old' H3 grid from map first
      removeH3Grid(map);
      return;
    }
    // If HB map is active: render hexagons
    if(filter.h3niveau === 'wijk') {
      renderGeometriesGrid(map, token, filter);
    } else {
      renderH3Grid(map, token, filter);
    }
  }, [
    map,
    is_hb_view,
    stateLayers.displaymode,
    filter.gebied,
    filter.h3niveau,
    filter.h3hexes7,
    filter.h3hexes8,
    filter.h3hexeswijk,
    filter.h3hexes7.length,
    filter.h3hexes8.length,
    filter.h3hexeswijk.length,
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
      let valueToSet;

      // If clicked on a H3 hex
      if(filter.h3niveau === 7 || filter.h3niveau === 8) {
        // Convert a lat/lng point to a hexagon index at resolution 7/8
        valueToSet = latLngToCell(coordinates.lat, coordinates.lng, filter.h3niveau);        
      }
      // If clicked on a CBS wijk:
      else if(filter.h3niveau === 'wijk') {
        valueToSet = e.features[0].properties.stats_ref;
      }

      // Check if user holds ctrl (or Command on MacOS)
      const userHoldsCtrl = (e.originalEvent !== undefined ? (e.originalEvent.metaKey || e.originalEvent.ctrlKey) : false);

      // Set valueToSet in state
      if(filter.h3niveau === 'wijk') {
        dispatch({ type: (userHoldsCtrl ? 'TOGGLE' : 'SET') + '_FILTER_H3HEXES_WIJK', payload: valueToSet });
      }
      else if(filter.h3niveau === 7) {
        dispatch({ type: (userHoldsCtrl ? 'TOGGLE' : 'SET') + '_FILTER_H3HEXES_7', payload: valueToSet });
      }
      else if(filter.h3niveau === 8) {
        dispatch({ type: (userHoldsCtrl ? 'TOGGLE' : 'SET') + '_FILTER_H3HEXES_8', payload: valueToSet });
      }
    }

    map.on('click', 'h3-hexes-layer-fill', didClick);

    return () => {
      map.off('click', 'h3-hexes-layer-fill', didClick);
    }
  }, [
    map,
    filter.h3niveau
  ])

}

export default DdH3HexagonLayer;
