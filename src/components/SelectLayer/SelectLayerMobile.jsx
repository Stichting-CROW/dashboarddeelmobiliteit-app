import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import MobileSlideBox from '../SlideBox/MobileSlideBox.jsx';

import './SelectLayerMobile.css';

import {
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN
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
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

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
        <div data-type="heat-map" className={`layer${displayMode!==DISPLAYMODE_PARKEERDATA_HEATMAP ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_DISPLAYMODE', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}>
          <span className="layer-title">
            Heat map
          </span>
        </div>

        <div data-type="pointers" className={`layer${displayMode!==DISPLAYMODE_PARKEERDATA_CLUSTERS ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_DISPLAYMODE', payload: DISPLAYMODE_PARKEERDATA_CLUSTERS }) }}>
          <span className="layer-title">
            Clusters
          </span>
        </div>

        <div data-type="vehicles"  className={`layer${displayMode!==DISPLAYMODE_PARKEERDATA_VOERTUIGEN ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_DISPLAYMODE', payload: DISPLAYMODE_PARKEERDATA_VOERTUIGEN }) }}>
          <span className="layer-title">
            Voertuigen
          </span>
        </div>

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