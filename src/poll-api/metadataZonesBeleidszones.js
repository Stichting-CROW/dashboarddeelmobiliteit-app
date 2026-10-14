/**
 * Fetches zones for /stats/beleidszones from MDS public/zones only.
 * Used when the user is on the beleidszones page.
 *
 * @see https://mds.dashboarddeelmobiliteit.nl/public/zones
 * @see https://docs.dashboarddeelmobiliteit.nl/api_docs/zone_statistics/
 */

import { getBeleidszonesZones } from '../api/beleidszones';
import { getEmptyZonesGeodataPayload } from './metadataZonesgeodata';

function parseZoneIds(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

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

    const zoneIdsFromFilter = parseZoneIds(state.filter?.zones);
    const zoneIdsFromUrl = typeof window !== 'undefined'
      ? parseZoneIds(new URLSearchParams(window.location.search).get('zones'))
      : [];
    const zoneIdsToInclude = [
      ...new Set([...zoneIdsFromFilter, ...zoneIdsFromUrl]),
    ];
    const zones = await getBeleidszonesZones(gmCode, zoneIdsToInclude);
    store.dispatch({ type: 'SET_ZONES', payload: zones });
    store.dispatch({ type: 'SET_ZONES_LOADED', payload: true });
  } catch (ex) {
    console.error('Unable to update beleidszones zones', ex);
    store.dispatch({ type: 'SET_ZONES', payload: [] });
    store.dispatch({ type: 'SET_ZONES_LOADED', payload: true });
  }
};
