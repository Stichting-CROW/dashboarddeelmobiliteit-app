/**
 * Fetches zones for /stats/beleidszones from MDS public/zones only.
 * Used when the user is on the beleidszones page.
 *
 * @see https://mds.dashboarddeelmobiliteit.nl/public/zones
 * @see https://docs.dashboarddeelmobiliteit.nl/api_docs/zone_statistics/
 */

import { getBeleidszonesZones } from '../api/beleidszones';
import { getEmptyZonesGeodataPayload } from './metadataZonesgeodata';

export const updateBeleidszonesZones = async (store) => {
  try {
    if (!store) return false;

    const state = store.getState();
    if (!state.metadata?.metadata_loaded) return false;

    const gmCode = state.filter?.gebied;
    if (!gmCode) {
      store.dispatch({ type: 'SET_ZONES', payload: [] });
      store.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload() });
      store.dispatch({ type: 'SET_ZONES_LOADED', payload: true });
      return;
    }

    store.dispatch({ type: 'SET_ZONES_LOADED', payload: false });

    const zones = await getBeleidszonesZones(gmCode);
    store.dispatch({ type: 'SET_ZONES', payload: zones });
    store.dispatch({ type: 'SET_ZONES_LOADED', payload: true });
  } catch (ex) {
    console.error('Unable to update beleidszones zones', ex);
    store.dispatch({ type: 'SET_ZONES', payload: [] });
    store.dispatch({ type: 'SET_ZONES_LOADED', payload: true });
  }
};
