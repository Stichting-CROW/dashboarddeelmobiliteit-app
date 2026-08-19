import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  renderHubs,
  removeHubsFromMap
} from '../Map/MapUtils/map.policy_hubs';
import { applyDataLayerOrderWhenReady } from '../Map/MapUtils/dataLayerOrder';
import { whenMapLayersMutable } from '../Map/MapUtils/mapGuards';
import { fetch_hubs } from '../../helpers/policy-hubs/fetch-hubs';
import { deDuplicateHubs, isHubInPhase } from '../../helpers/policy-hubs/common';
import { selectDataLayerOrder, selectOverlayLayers, isOverlayLayerEnabled } from '../../helpers/layerSelectors';
import {
  DATA_LAYER_ORDER_HUBS,
  DATA_LAYER_ORDER_VERBODSGEBIEDEN
} from '../../reducers/layers.js';

import { StateType } from '../../types/StateType';

const HUBS_SOURCE_KEY = 'overlay-hubs';
const VERBODSGEBIEDEN_SOURCE_KEY = 'overlay-verbodsgebieden';

let TO_fetch_delay;

/**
 * Lightweight, view-only overlay that renders Hubs and/or Verbodsgebieden on
 * map pages other than /map/beleidshubs. Each geography type is rendered in
 * its own map source, so both can be reordered independently via the
 * draggable data-layer list. No editing, phase menu or click handlers.
 */
const DdPolicyHubsOverlay = ({
  map
}): JSX.Element => {
  const [policyHubs, setPolicyHubs] = useState([]);

  const uniqueComponentId = useRef(`overlay-hubs-${Math.round(Math.random() * 9000000)}`);

  const filter = useSelector((state: StateType) => state.filter || null);
  const mapStyle = useSelector((state: StateType) => state.layers?.map_style || null);
  const displayMode = useSelector((state: StateType) => state.layers?.displaymode || '');
  const overlayLayers = useSelector(selectOverlayLayers);
  const dataLayerOrder = useSelector(selectDataLayerOrder);

  const token = useSelector((state: StateType) => {
    if (state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });

  const hubsEnabled = isOverlayLayerEnabled(overlayLayers, displayMode, DATA_LAYER_ORDER_HUBS);
  const verbodsgebiedenEnabled = isOverlayLayerEnabled(overlayLayers, displayMode, DATA_LAYER_ORDER_VERBODSGEBIEDEN);
  const hubsPhase = overlayLayers.phases[DATA_LAYER_ORDER_HUBS];
  const verbodsgebiedenPhase = overlayLayers.phases[DATA_LAYER_ORDER_VERBODSGEBIEDEN];

  // Synthetic visible_layers, in the same format policy_hubs state uses
  const visibleLayers = [
    ...(hubsEnabled ? [`hub-${hubsPhase}`] : []),
    ...(verbodsgebiedenEnabled ? [`verbodsgebied-${verbodsgebiedenPhase}`] : [])
  ];

  // fetch_hubs adds retirement phases to the request for 'published'/'active';
  // pass the most permissive selected phase so those zones are included too.
  const selectedPhases = [
    ...(hubsEnabled ? [hubsPhase] : []),
    ...(verbodsgebiedenEnabled ? [verbodsgebiedenPhase] : [])
  ];
  const fetchPhase = selectedPhases.includes('active')
    ? 'active'
    : (selectedPhases.includes('published') ? 'published' : '');

  // (Re-)fetch hubs if the municipality, phases or enabled layers change
  useEffect(() => {
    if (!filter?.gebied) {
      setPolicyHubs([]);
      return;
    }
    if (visibleLayers.length === 0) {
      setPolicyHubs([]);
      return;
    }

    let isStale = false;

    if (TO_fetch_delay) clearTimeout(TO_fetch_delay);
    TO_fetch_delay = setTimeout(async () => {
      try {
        const res: any = await fetch_hubs({
          token: token,
          municipality: filter.gebied,
          phase: fetchPhase,
          visible_layers: visibleLayers
        }, uniqueComponentId.current);
        if (isStale) return;
        setPolicyHubs(res && !res.message ? res : []);
      }
      catch (err) {
        console.error(err);
      }
    }, 50);

    return () => {
      isStale = true;
    };
  }, [
    filter?.gebied,
    token,
    JSON.stringify(visibleLayers)
  ]);

  // Render hubs and verbodsgebieden, each in their own source
  useEffect(() => {
    if (!map) return;

    const hubs = Array.isArray(policyHubs) ? policyHubs : [];

    if (hubsEnabled) {
      const layerFilter = [`hub-${hubsPhase}`];
      const filtered = deDuplicateHubs(
        hubs.filter((x: any) => x.geography_type === 'stop' && isHubInPhase(x, hubsPhase, layerFilter))
      );
      renderHubs(map, filtered, [], [], HUBS_SOURCE_KEY);
    } else {
      removeHubsFromMap(map, HUBS_SOURCE_KEY);
    }

    if (verbodsgebiedenEnabled) {
      const layerFilter = [`verbodsgebied-${verbodsgebiedenPhase}`];
      const filtered = deDuplicateHubs(
        hubs.filter((x: any) => x.geography_type === 'no_parking' && isHubInPhase(x, verbodsgebiedenPhase, layerFilter))
      );
      renderHubs(map, filtered, [], [], VERBODSGEBIEDEN_SOURCE_KEY);
    } else {
      removeHubsFromMap(map, VERBODSGEBIEDEN_SOURCE_KEY);
    }

    // Re-apply the user-defined z-order now that the layers exist
    applyDataLayerOrderWhenReady(map, dataLayerOrder[displayMode], displayMode);
  }, [
    map,
    policyHubs,
    hubsEnabled,
    verbodsgebiedenEnabled,
    hubsPhase,
    verbodsgebiedenPhase,
    mapStyle,
    displayMode,
    JSON.stringify(dataLayerOrder)
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (TO_fetch_delay) clearTimeout(TO_fetch_delay);
      if (map) {
        whenMapLayersMutable(map, () => {
          removeHubsFromMap(map, HUBS_SOURCE_KEY);
          removeHubsFromMap(map, VERBODSGEBIEDEN_SOURCE_KEY);
        });
      }
    };
  }, [map]);

  return <></>;
}

export default DdPolicyHubsOverlay;
