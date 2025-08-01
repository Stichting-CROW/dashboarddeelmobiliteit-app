import { useDispatch, useSelector } from "react-redux";
import { StateType } from "@/src/types/StateType";
import { useBackgroundLayer } from '../Map/MapUtils/useBackgroundLayer';
import { setMapStyle } from '../../actions/layers';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_PARKEERDATA_HEATMAP,
  DISPLAYMODE_PARKEERDATA_CLUSTERS,
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_HB,
  DISPLAYMODE_VERHUURDATA_HEATMAP,
  DISPLAYMODE_VERHUURDATA_CLUSTERS,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
  DISPLAYMODE_POLICY_HUBS
} from '../../reducers/layers.js';

const SelectLayerModal = () => {
  const dispatch = useDispatch();
  const { setLayer } = useBackgroundLayer(window['ddMap']);

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const viewPark = useSelector((state: StateType) => {
    return state.layers ? state.layers.view_park : DISPLAYMODE_PARKEERDATA_VOERTUIGEN;
  });

  const viewRentals = useSelector((state: StateType) => {
    return state.layers ? state.layers.view_rentals : DISPLAYMODE_VERHUURDATA_VOERTUIGEN;
  });
  
  const layers = useSelector((state: StateType) => {
    return state.layers ? state.layers : null;
  });

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const zonesVisible = useSelector((state: StateType) => {
    return state.layers ? state.layers.zones_visible : false;
  });

  return <>
    <div className="SelectLayer">
      <h2>Basislaag</h2>

        <div 
          data-type="map-style-default" 
          className={`layer${layers.map_style!=='base' ? ' layer-inactive':''}`} 
          onClick={() => {
            setLayer('base');
          }}
        >
          <span className="layer-title">
            Terrein
          </span>
        </div>
        <div 
          data-type="map-style-satellite" 
          className={`layer${layers.map_style!=='satellite' ? ' layer-inactive':''}`} 
          onClick={() => {
            setLayer('satellite');
          }}
        >
          <span className="layer-title">
            Luchtfoto
          </span>
        </div>
        {isLoggedIn && <div
          className={`layer${!zonesVisible ? ' layer-inactive':''}`}
          style={{width: '1px', borderColor: '#eee'}}
        />}

        {isLoggedIn && <>
          <div data-type="zones" className={`layer${!zonesVisible ? ' layer-inactive':''}`} onClick={() => {
            dispatch({ type: 'LAYER_TOGGLE_ZONES_VISIBLE', payload: null })
          }}>
            <span className="layer-title">
              CBS-gebied
            </span>
          </div>
        </>}

      <h2>Datalaag</h2>

      {displayMode===DISPLAYMODE_PARK &&
        <div
          data-type="heat-map"
          className={`layer${viewPark!==DISPLAYMODE_PARKEERDATA_HEATMAP ? ' layer-inactive':''}`}
          onClick={() => { dispatch({ type: 'LAYER_SET_VIEW_PARK', payload: DISPLAYMODE_PARKEERDATA_HEATMAP }) }}
        >
        <span className="layer-title">
          Heat map
        </span>
      </div>}

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

      { (displayMode===DISPLAYMODE_RENTALS) ?
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

    </div>
  </>
}

export default SelectLayerModal;
