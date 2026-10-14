import { useSelector } from "react-redux";
import { StateType } from "../../types/StateType";
import { useBackgroundLayer } from '../Map/MapUtils/useBackgroundLayer';
import { selectActiveDataLayers } from '../../helpers/layerSelectors';
import { isOperatorPrestatiesView } from '../../helpers/prestatiesAanbiedersViewMode';
import { isOperatorAccount } from '../../helpers/authentication';
import DataLayerList from './DataLayerList';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_SERVICE_AREAS,
  DISPLAYMODE_POLICY_HUBS
} from '../../reducers/layers.js';

const SelectLayerModal = () => {
  const { setLayer } = useBackgroundLayer(window['ddMap']);

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });

  const activeDataLayers = useSelector(selectActiveDataLayers);

  const layers = useSelector((state: StateType) => {
    return state.layers ? state.layers : null;
  });

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const acl = useSelector((state: StateType) => {
    return state.authentication?.user_data?.acl;
  });

  const aclOperators = useSelector((state: StateType) => {
    return state.metadata?.aclOperators ?? [];
  });

  const isOperatorUser = isLoggedIn && (
    isOperatorAccount(acl) || isOperatorPrestatiesView(aclOperators)
  );

  const zonesVisible = useSelector((state: StateType) => {
    return state.layers ? state.layers.zones_visible : false;
  });

  // Don't render until we have proper state
  if (!activeDataLayers || typeof activeDataLayers !== 'object') {
    return <div className="SelectLayer">Loading...</div>;
  }

  return <>
    <div className="SelectLayer">
      <h2>Achtergrond</h2>

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

      {(displayMode === DISPLAYMODE_PARK
        || displayMode === DISPLAYMODE_RENTALS
        || displayMode === DISPLAYMODE_SERVICE_AREAS
        || displayMode === DISPLAYMODE_POLICY_HUBS) && <>
        <h2>Andere datalaag</h2>
        <DataLayerList
          displayMode={displayMode}
          isLoggedIn={isLoggedIn}
          isOperatorUser={isOperatorUser}
          zonesVisible={zonesVisible}
        />
      </>}

    </div>
  </>
}

export default SelectLayerModal;
