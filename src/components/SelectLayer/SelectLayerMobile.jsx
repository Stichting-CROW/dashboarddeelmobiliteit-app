import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MobileSlideBox from '../SlideBox/MobileSlideBox.jsx';

import './SelectLayerMobile.css';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  // DISPLAYMODE_OTHER,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_CLUSTERS,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN
} from '../../reducers/layers.js';

function SelectLayerMobile(props) {
  const dispatch = useDispatch()

  const isVisible = useSelector(state => {
    return state.ui ? state.ui['MenuSecondary.layers'] : false;
  });

  const showZoneOnOff = useSelector(state => {
    return state.filter ? state.filter.gebied!=='' : false;
  });

  const zonesVisible = useSelector(state => {
    return state.layers ? state.layers.zones_visible : false;
  });
  
  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const viewPark = useSelector(state => {
    return state.layers ? state.layers.view_park : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  // console.log("MOBILE selection", displayMode)
  
  const setVisibility = (name, visibility) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    })
  }
  
  return (
    <MobileSlideBox
      title="Lagen"
      isVisible={isVisible}
      closeHandler={() => {
        setVisibility('MenuSecondary.layers', false);
      }}
      classes="
        top-auto
      "
    >
      <div className={`
        SelectLayerMobile
        flex justify-between
      `}>
      { displayMode===DISPLAYMODE_PARK ?
            <div data-type="heat-map" className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_HEATMAP ? ' layer-inactive':''}`}
              onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}>
              <span className="layer-title">
                Heat map
              </span>
            </div> : null }

      { displayMode===DISPLAYMODE_PARK ?
        <div data-type="pointers" className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_CLUSTERS ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_CLUSTERS }) }}>
          <span className="layer-title">
            Clusters
          </span>
          </div> : null }

      { displayMode===DISPLAYMODE_PARK ?
        <div data-type="vehicles"  className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_VOERTUIGEN ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_VOERTUIGEN }) }}>
          <span className="layer-title">
            Voertuigen
          </span>
          </div> : null }

      { displayMode===DISPLAYMODE_RENTALS ?
            <div data-type="heat-map" className={`layer${viewPark!==DISPLAYMODE_VERHUURDATA_HEATMAP ? ' layer-inactive':''}`}
              onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_HEATMAP }) }}>
              <span className="layer-title">
                Heat map
              </span>
            </div> : null }

      { displayMode===DISPLAYMODE_RENTALS ?
        <div data-type="pointers" className={`layer${viewPark!==DISPLAYMODE_VERHUURDATA_CLUSTERS ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_CLUSTERS }) }}>
          <span className="layer-title">
            Clusters
          </span>
          </div> : null }

      { displayMode===DISPLAYMODE_RENTALS ?
        <div data-type="vehicles"  className={`layer${viewPark!==DISPLAYMODE_VERHUURDATA_VOERTUIGEN ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_VOERTUIGEN }) }}>
          <span className="layer-title">
            Voertuigen
          </span>
          </div> : null }

      { isLoggedIn && showZoneOnOff ?
          <div data-type="zones" className={`layer${!zonesVisible ? ' layer-inactive':''}`} onClick={() => {
              dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null })
          }}>
            <span className="layer-title">
              Zones
            </span>
          </div> : null
        }
      </div>
    </MobileSlideBox>
  )
}

export {
  SelectLayerMobile
}