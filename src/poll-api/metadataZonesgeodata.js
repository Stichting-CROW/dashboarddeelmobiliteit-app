import {isLoggedIn, isAdmin} from '../helpers/authentication.js';

export const getEmptyZonesGeodataPayload = () => {
  return {
    "data": {
      "type":"FeatureCollection",
      "features":[]
    },
    "filter": ""
  }
}

const buildGeodataFromMdsZones = (zones, selectedZoneIds, store, state) => {
  const st = require('geojson-bounds');
  const geojson = { type: 'FeatureCollection', features: [] };
  let fullextent = undefined;

  const zonesToUse = selectedZoneIds && selectedZoneIds.length > 0
    ? zones.filter((z) => selectedZoneIds.includes(String(z.zone_id)))
    : zones;

  zonesToUse.forEach((zonedata) => {
    const geom = zonedata.area?.geometry;
    if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return;

    const feature = { type: 'Feature', geometry: geom };
    geojson.features.push(feature);

    const extent = st.extent(feature);
    if (fullextent === undefined) {
      fullextent = extent;
    } else {
      fullextent[0] = Math.min(extent[0], fullextent[0]);
      fullextent[1] = Math.min(extent[1], fullextent[1]);
      fullextent[2] = Math.max(extent[2], fullextent[2]);
      fullextent[3] = Math.max(extent[3], fullextent[3]);
    }
  });

  const payload = { data: geojson, filter: state.filter.zones, bounds: fullextent };
  store.dispatch({ type: 'SET_ZONES_GEODATA', payload });
  store.dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: fullextent });
};

const buildGeodataFromDashboardZones = (metadata, store, state) => {
  const st = require('geojson-bounds');
  const geojson = { type: 'FeatureCollection', features: [] };
  let fullextent = undefined;

  metadata.zones.forEach((zonedata) => {
    const geom = zonedata.geojson;
    if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return;

    const feature = { type: 'Feature', geometry: geom };
    geojson.features.push(feature);

    const extent = st.extent(feature);
    if (fullextent === undefined) {
      fullextent = extent;
    } else {
      fullextent[0] = Math.min(extent[0], fullextent[0]);
      fullextent[1] = Math.min(extent[1], fullextent[1]);
      fullextent[2] = Math.max(extent[2], fullextent[2]);
      fullextent[3] = Math.max(extent[3], fullextent[3]);
    }
  });

  const payload = { data: geojson, filter: state.filter.zones, bounds: fullextent };
  store.dispatch({ type: 'SET_ZONES_GEODATA', payload });
  store.dispatch({ type: 'LAYER_SET_ZONES_EXTENT', payload: fullextent });
};

export const updateZonesgeodata = (store) => {
  try {
    if (store === undefined) return false;

    const state = store.getState();
    if (state.metadata.zones_loaded === false) return false;

    const pathName = typeof window !== 'undefined' ? window.location?.pathname ?? '' : '';
    const useMds = pathName.includes('/stats/beleidszones');

    let zone_ids = '';
    if (!state) {
      zone_ids = '';
    } else if (state.filter.gebied === '' && isAdmin(state)) {
      // Don't show all zone boundaries
    } else if (state.filter.gebied === '') {
      zone_ids = state.metadata.zones
        .filter((zone) => zone.zone_type === 'municipality')
        .map((zone) => zone.zone_id)
        .join(',');
    } else if (state.filter.zones.length === 0) {
      const list_g = state.metadata.gebieden
        .filter((gebied) => gebied.gm_code === state.filter.gebied)
        .map((gebied) => gebied.gm_code);
      const list_z = state.metadata.zones.filter(
        (zone) => zone.zone_type === 'municipality' && list_g.includes(zone.municipality)
      );
      zone_ids = list_z.map((zone) => zone.zone_id).join(',');
    } else {
      zone_ids = state.filter.zones;
    }

    if (zone_ids === '' && !useMds) {
      store.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload() });
      return;
    }

    if (useMds) {
      if (!state.filter.gebied) {
        store.dispatch({ type: 'SET_ZONES_GEODATA', payload: getEmptyZonesGeodataPayload() });
        return;
      }

      store.dispatch({ type: 'SHOW_LOADING', payload: true });

      const gmCode = state.filter.gebied;
      const url = `${process.env.REACT_APP_MDS_URL}/public/zones?municipality=${encodeURIComponent(gmCode)}&geography_types=no_parking&geography_types=stop&geography_types=monitoring&phases=active&phases=retirement_concept&phases=committed_retirement_concept&phases=published_retirement&phases=archived`;

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            console.error('unable to fetch MDS zones:', response.status);
            return [];
          }
          return response.json();
        })
        .then((raw) => {
          const zones = Array.isArray(raw) ? raw : raw?.zones ?? raw?.data ?? [];
          const selectedZoneIds = state.filter.zones
            ? state.filter.zones.split(',').map((id) => id.trim()).filter(Boolean)
            : null;
          buildGeodataFromMdsZones(zones, selectedZoneIds, store, state);
        })
        .catch((ex) => console.error('unable to fetch MDS zone geodata', ex))
        .finally(() => store.dispatch({ type: 'SHOW_LOADING', payload: false }));

      return;
    }

    store.dispatch({ type: 'SHOW_LOADING', payload: true });

    const url_zonesgeodata = isLoggedIn(state)
      ? `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/zones?zone_ids=${zone_ids}&include_geojson=true`
      : `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/zones?zone_ids=${zone_ids}&include_geojson=true`;

    const fetchOptions = isLoggedIn(state)
      ? { headers: { authorization: 'Bearer ' + state.authentication.user_data.token } }
      : {};

    fetch(url_zonesgeodata, fetchOptions)
      .then((response) => {
        if (!response.ok) {
          console.error('unable to fetch:', response);
          return;
        }
        return response.json();
      })
      .then((metadata) => {
        if (!metadata?.zones) return;
        buildGeodataFromDashboardZones(metadata, store, state);
      })
      .catch((ex) => console.error('unable to fetch zone geodata', ex))
      .finally(() => store.dispatch({ type: 'SHOW_LOADING', payload: false }));
  } catch (ex) {
    console.error('Unable to update zones', ex);
  }
};
