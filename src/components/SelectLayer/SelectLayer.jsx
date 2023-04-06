import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';

import {StateType} from '../../types/StateType';

import './SelectLayer.css';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_OTHER,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_HB,
  DISPLAYMODE_VERHUURDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_CLUSTERS,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN
} from '../../reducers/layers.js';

import {getMapStyles, setMapStyle} from '../Map/MapUtils/map.js';

function SelectLayer(props) {
  // const {setLayers, setActiveSource} = props;
  const dispatch = useDispatch()
  
  const showZoneOnOff = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied!=='' : false;
  });

  const zonesVisible = useSelector((state: StateType) => {
    return state.layers ? state.layers.zones_visible : false;
  });
  
  const layers = useSelector((state: StateType) => {
    return state.layers ? state.layers : null;
  });

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const viewPark = useSelector((state: StateType) => {
    return state.layers ? state.layers.view_park : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });

  const viewRentals = useSelector((state: StateType) => {
    return state.layers ? state.layers.view_rentals : DISPLAYMODE_VERHUURDATA_VOERTUIGEN;
  });

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });
  
  const userData = useSelector((state: StateType) => {
    return state.authentication.user_data;
  });

  if(displayMode===DISPLAYMODE_OTHER) {
    return null; // no layer selection
  }

  const doShowOd = () => {
    return true;

    const emailAddresses = [
      'bart+schiedam@tuxion.nl',
      'mail@bartroorda.nl',
      // 'rinse.gorter@denhaag.nl',
      'otto.vanboggelen@crow.nl',
      'sven.boor@gmail.com'
    ]
    return userData && userData.user && emailAddresses.indexOf(userData.user.email) > -1;
  }
  
  const mapStyles = getMapStyles();

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

        { (displayMode===DISPLAYMODE_RENTALS && doShowOd()) ?
          <div data-type="od" className={`layer${viewRentals!==DISPLAYMODE_VERHUURDATA_HB ? ' layer-inactive':''}`}
            onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_RENTALS', payload: DISPLAYMODE_VERHUURDATA_HB }) }}>
            <span className="layer-title">
              HB
            </span>
          </div>: null }

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

        {displayMode===DISPLAYMODE_ZONES_ADMIN && <>
          <div data-type="map-style-default" className={`layer${layers.map_style!=='default' ? ' layer-inactive':''}`} onClick={() => {
            dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'default' })
            setMapStyle(window.ddMap, mapStyles.base)
          }}>
            <span className="layer-title">
              Terrein
            </span>
          </div>
          <div data-type="map-style-satelite" className={`layer${layers.map_style!=='satelite' ? ' layer-inactive':''}`} onClick={() => {
            dispatch({ type: 'LAYER_SET_MAP_STYLE', payload: 'satelite' })
            setMapStyle(window.ddMap, mapStyles.satelite)
          }}>
            <span className="layer-title">
              Sateliet
            </span>
          </div>
        </>}

        {displayMode===DISPLAYMODE_ZONES_PUBLIC && false && <>

          <div
            data-type="monitoring"
            className={`layer`}
            onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
          >
            <span className="layer-title">
              Analyse
            </span>
          </div>

          <div
            data-type="parking"
            className={`layer`}
            onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
          >
            <span className="layer-title">
              Parking
            </span>
          </div>

          <div
            data-type="no parking"
            className={`layer`}
            onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
          >
            <span className="layer-title">
              No parking
            </span>
          </div>

        </>}

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