import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {latLngToCell} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_OTHER,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_HB,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,

} from '../../reducers/layers.js';

import {StateType} from '../../types/StateType';
import { selectActiveDataLayers, isRentalsLayerActive, selectDataLayerOrder } from '../../helpers/layerSelectors';

import {
  removeH3Grid,
  setH3GridLoadingState,
  updateSelectedCells,
  getSelectedHbCells,
  HbRenderResult
} from '../Map/MapUtils/map.hb';
import {
  renderGeometriesGrid
} from '../Map/MapUtils/map.hb.geometries';
import {
  renderH3Grid,
  rerenderH3GridForViewport
} from '../Map/MapUtils/map.hb.h3';
import { applyDataLayerOrderWhenReady } from '../Map/MapUtils/dataLayerOrder';
import HbStatusWidget from './HbStatusWidget/HbStatusWidget';

const DdH3HexagonLayer = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch()

  const activeDataLayers = useSelector(selectActiveDataLayers);

  const checkRentalsLayerActive = (layerName: string) => {
    return isRentalsLayerActive(activeDataLayers, layerName);
  };

  const displayMode = useSelector((state: StateType) => state.layers ? state.layers.displaymode : DISPLAYMODE_PARK);
  const dataLayerOrder = useSelector(selectDataLayerOrder);
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const viewRentals = useSelector((state: StateType) => state.layers ? state.layers.view_rentals : null);
  // const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');
  const is_hb_view=checkRentalsLayerActive(DISPLAYMODE_VERHUURDATA_HB);
  const filter = useSelector((state: StateType) => state.filter || null);
  const metadata = useSelector((state: StateType) => state.metadata || null);
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

  const hbRetryCount = useSelector((state: StateType) => {
    return state.rentals ? (state.rentals.hb_retry_count || 0) : 0;
  });
  // Updated on moveend/zoomend (see MapComponent.registerMapView)
  const mapExtentKey = useSelector((state: StateType) => {
    return JSON.stringify(state.layers ? state.layers.mapextent : null);
  });

  const selectedCells = getSelectedHbCells(filter);
  const selectedCellsKey = JSON.stringify(selectedCells);

  // Cleanup H3 grid on unmount (synchronous; see MapComponent map teardown).
  useEffect(() => {
    return () => {
      removeH3Grid(map);
      setH3GridLoadingState(map, false);
      dispatch({ type: 'RESET_HB_STATUS' });
    };
  }, [map]);

  // Give immediate feedback on a click: outline the selected cell(s) on the
  // grid that is already on the map, before the new HB data has arrived.
  useEffect(() => {
    if(! map || ! is_hb_view) return;
    updateSelectedCells(map, selectedCells);
  }, [
    map,
    is_hb_view,
    selectedCellsKey
  ]);

  // Keep the grid in view when the map is moved. Uses the OD data of the last
  // render, so this never triggers a (slow) fetch.
  useEffect(() => {
    if(! map || ! is_hb_view) return;
    const stats = rerenderH3GridForViewport(map, filter);
    if (stats) {
      // Only merged by the reducer when the last load succeeded
      dispatch({
        type: 'UPDATE_HB_RESULT',
        payload: {
          cell_count: stats.cell_count,
          cells_with_trips: stats.cells_with_trips
        }
      });
    }
  }, [
    map,
    is_hb_view,
    mapExtentKey
  ]);

  // If HB view: Show H3 grid, if not: Remove H3 grid
  useEffect(() => {
    // Stop if map didn't load
    if(! map) return;
    // Stop if no HB mode
    if(! is_hb_view) {
      // If no HB view: remove remove 'old' H3 grid from map first
      removeH3Grid(map);
      setH3GridLoadingState(map, false);
      dispatch({ type: 'RESET_HB_STATUS' });
      return;
    }
    // If HB map is active: render hexagons
    let cancelled = false;
    const isCancelled = () => cancelled;
    const startedAt = Date.now();

    // Tell the user we're loading: status widget, dimmed grid, progress cursor
    dispatch({ type: 'SET_HB_LOADING', payload: startedAt });
    setH3GridLoadingState(map, true);

    const applyOrder = () => {
      applyDataLayerOrderWhenReady(
        map,
        dataLayerOrder[DISPLAYMODE_RENTALS],
        DISPLAYMODE_RENTALS
      );
    };

    const renderPromise: Promise<HbRenderResult> = filter.h3niveau === 'wijk'
      ? renderGeometriesGrid(map, token, filter, metadata, { isCancelled })
      : renderH3Grid(map, token, filter, metadata, { isCancelled });

    renderPromise
      .then((result) => {
        // A newer render superseded this one; it manages the loading state
        if (cancelled || ! result || result.status === 'aborted') return;

        setH3GridLoadingState(map, false);

        if (result.status === 'ok') {
          dispatch({
            type: 'SET_HB_SUCCESS',
            payload: {
              ...result.stats,
              selected_count: selectedCells.length,
              duration_ms: Date.now() - startedAt
            }
          });
          applyOrder();
        }
        else {
          dispatch({
            type: 'SET_HB_ERROR',
            payload: {
              message: result.message,
              http_status: result.httpStatus
            }
          });
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Rendering HB grid failed', e);
        setH3GridLoadingState(map, false);
        dispatch({
          type: 'SET_HB_ERROR',
          payload: { message: 'Onverwachte fout bij het tonen van de HB-relaties' }
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    hbRetryCount,
    map,
    is_hb_view,
    metadata?.aclOperators,
    stateLayers.displaymode,
    JSON.stringify(dataLayerOrder),
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
      try {
        map.off('click', 'h3-hexes-layer-fill', didClick);
      } catch {
        // Map may already be torn down during route navigation.
      }
    }
  }, [
    map,
    filter.h3niveau
  ])

  if (! is_hb_view) return <></>;

  return <HbStatusWidget />
}

export default DdH3HexagonLayer;
