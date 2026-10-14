import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  renderServiceAreas,
  removeServiceAreasFromMap,
} from '../Map/MapUtils/map.service_areas';
import { applyDataLayerOrderWhenReady } from '../Map/MapUtils/dataLayerOrder';
import { whenMapLayersMutable } from '../Map/MapUtils/mapGuards';
import { loadServiceAreas } from '../../helpers/service-areas';
import { useAvailableServiceAreaOperators } from '../../helpers/service-areas/useAvailableServiceAreaOperators';
import { selectDataLayerOrder } from '../../helpers/layerSelectors';
import { showServiceAreaForOperator } from '../../actions/service-areas';

import { StateType } from '../../types/StateType';

/**
 * Lightweight overlay that renders service areas ("Servicegebieden") on map
 * pages other than /map/servicegebieden. It only draws the polygons; all
 * version-history UI stays in DdServiceAreasLayer.
 */
const DdServiceAreasOverlay = ({
  map
}): JSX.Element => {
  const dispatch = useDispatch();
  const [serviceAreas, setServiceAreas] = useState([]);

  const filter = useSelector((state: StateType) => state.filter || null);
  const visible_operators = useSelector((state: StateType) => {
    return state.service_areas ? state.service_areas.visible_operators : null;
  });
  const mapStyle = useSelector((state: StateType) => state.layers?.map_style || null);
  const displayMode = useSelector((state: StateType) => state.layers?.displaymode || '');
  const dataLayerOrder = useSelector(selectDataLayerOrder);
  const { operators: availableOperators } = useAvailableServiceAreaOperators(filter?.gebied);

  // Select the first available operator if the current selection isn't available
  useEffect(() => {
    if (availableOperators.length === 0) return;
    const hasValidSelection = visible_operators
      && visible_operators.length > 0
      && availableOperators.includes(visible_operators[0]);
    if (!hasValidSelection) {
      dispatch(showServiceAreaForOperator(availableOperators[0]));
    }
  }, [availableOperators, visible_operators, dispatch]);

  // Load service areas for the selected municipality and operators
  useEffect(() => {
    if (!filter?.gebied || !visible_operators || visible_operators.length === 0) {
      setServiceAreas([]);
      return;
    }

    let isStale = false;

    loadServiceAreas(filter.gebied, visible_operators)
      .then((service_areas) => {
        if (isStale) return;
        setServiceAreas(service_areas);
      })
      .catch((error) => {
        console.error('Error loading service areas:', error);
      });

    return () => {
      isStale = true;
    };
  }, [
    filter?.gebied,
    visible_operators
  ]);

  // Render service areas on the map
  useEffect(() => {
    if (!map) return;

    const serviceAreaForMunicipality = serviceAreas && filter?.gebied
      ? serviceAreas.find(x => x.municipality === filter.gebied)
      : null;

    if (!serviceAreaForMunicipality || !visible_operators || visible_operators.length === 0) {
      removeServiceAreasFromMap(map);
      return;
    }

    renderServiceAreas(map, visible_operators[0], serviceAreaForMunicipality.geometries);

    // Re-apply the user-defined z-order now that the layers exist
    applyDataLayerOrderWhenReady(map, dataLayerOrder[displayMode], displayMode);
  }, [
    map,
    serviceAreas,
    filter?.gebied,
    visible_operators,
    mapStyle,
    displayMode,
    JSON.stringify(dataLayerOrder)
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        whenMapLayersMutable(map, () => removeServiceAreasFromMap(map));
      }
    };
  }, [map]);

  return <></>;
}

export default DdServiceAreasOverlay;
