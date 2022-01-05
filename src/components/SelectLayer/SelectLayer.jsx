import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';

import './SelectLayer.css';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_OTHER,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_CLUSTERS,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN
} from '../../reducers/layers.js';

function SelectLayer(props) {
  // const {setLayers, setActiveSource} = props;
  const dispatch = useDispatch()
  
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

  const viewRentals = useSelector(state => {
    return state.layers ? state.layers.view_rentals : DISPLAYMODE_VERHUURDATA_VOERTUIGEN;
  });

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  if(displayMode===DISPLAYMODE_OTHER||
     (displayMode===DISPLAYMODE_RENTALS && showZoneOnOff===false)) {
       return null; // no layer selection
  }
  
  return (
    <SlideBox name="SelectLayer" direction="right" options={{
      title: 'Lagen',
      backgroundColor: '#fff',
    }} style={{
      position: 'absolute',
      top: '8px',
      right: 0
    }}>
      <div className="SelectLayer pr-1">
        { displayMode===DISPLAYMODE_PARK ?
            <div data-type="heat-map" className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_HEATMAP ? ' layer-inactive':''}`}
              onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}>
              <span className="layer-title">
                Heat map
              </span>
            </div>: null }

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
            <div data-type="heat-map" className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_HEATMAP ? ' layer-inactive':''}`}
              onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_HEATMAP }) }}>
              <span className="layer-title">
                Heat map
              </span>
            </div>: null }

        { displayMode===DISPLAYMODE_RENTALS ?
            <div data-type="pointers" className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_CLUSTERS ? ' layer-inactive':''}`}
              onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_CLUSTERS }) }}>
              <span className="layer-title">
                Clusters
              </span>
            </div> : null }

        { displayMode===DISPLAYMODE_RENTALS ?
          <div data-type="vehicles"  className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_VOERTUIGEN ? ' layer-inactive':''}`}
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
    </SlideBox>
  )
}

export {
  SelectLayer
}