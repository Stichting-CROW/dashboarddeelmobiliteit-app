import {
  fetchHbData,
  renderPolygons_fill,
  renderPolygons_border,
  renderPercentageValues,
  getHbRenderStats,
  getSelectedHbCells,
  waitUntilMapLayersMutable,
  HbRenderOptions,
  HbRenderResult
} from './map.hb';

type AccessibleGeometriesResult =
  | { status: 'ok'; geometries: any[] }
  | { status: 'error'; message: string; httpStatus?: number };

// Get geometries for user
const getGeometriesForUser = async (
  map,
  token,
  filter
): Promise<AccessibleGeometriesResult> => {
  // Get hexes user has access to
  const url = encodeURI(`${process.env.REACT_APP_MAIN_API_URL}/od-api/accessible/geometry?${filter.gebied ? 'filter_municipalities=' + filter.gebied : ''}`);

  let responseJson, httpStatus;

  try {
    let response = await fetch(url, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${token}`
      }
    });
    httpStatus = response.status;
    if (! response.ok) {
      return {
        status: 'error',
        message: `Toegankelijke wijken ophalen mislukt (HTTP ${httpStatus})`,
        httpStatus
      };
    }
    responseJson = await response.json();
  } catch(e) {
    console.error(e);
    return {
      status: 'error',
      message: 'Toegankelijke wijken ophalen mislukt (netwerkfout)'
    };
  }

  // Validate
  if(! responseJson || ! responseJson.result || ! responseJson.result.accessible_geometries) {
    console.error('No valid response json returned for getting accessible geometries')
    return {
      status: 'error',
      message: 'Ongeldig antwoord bij ophalen van toegankelijke wijken',
      httpStatus
    };
  }

  // Otherwise: Return all geometries available for user
  return { status: 'ok', geometries: responseJson.result.accessible_geometries };
}

const createFeatureCollection = (filter, allGeometries, geometriesHbData) => {
  let features = [];

  // Get selected h3 hexe(s) from state
  const selectedGeographies = filter.h3hexeswijk;

  // Create features array
  allGeometries.forEach(x => {
    features.push({
      "type": "Feature",
      "id": "87196ba25ffffff",
      "properties": {
        "zone_id": x.zone_id,
        "municipality_code": x.municipality_code,
        "stats_ref": x.stats_ref,
        "cell": x.stats_ref,
        "selected": selectedGeographies.indexOf(x.stats_ref) > -1 ? 1 : 0
      },
      "geometry": x.geojson
    });
  });

  // Add value to features
  const getValueBasedOnCbsRef = (data, cbsRef: string) => {
    const found = data.filter(x => {
      if(x.origin_stat_ref === cbsRef) return true;
      if(x.destination_stat_ref === cbsRef) return true;
      return false;
    })
    // Return number of trips for this cbsRef
    if(found && found[0]) {
      return found[0].number_of_trips;
    } else {
      return 0;
    }
  }
  features.map(x => {
    x.properties.value = getValueBasedOnCbsRef(geometriesHbData, x.properties.stats_ref);
    return x;
  })

  return {
    "type": "FeatureCollection",
    "features": features
  }
}

const renderGeometriesGrid = async (
  map: any,
  token: string,
  filter: any,
  metadata: any,
  options: HbRenderOptions = {}
): Promise<HbRenderResult> => {
  const isCancelled = options.isCancelled || (() => false);

  // Render grid for full map
  const geometriesForUser = await getGeometriesForUser(map, token, filter)
  if (isCancelled()) return { status: 'aborted' };
  if (geometriesForUser.status !== 'ok') return geometriesForUser;
  
  // Get OD data. Without a selected wijk there is nothing to relate to (the
  // API rejects an empty list), so only draw the empty grid then.
  let hbData = [];
  if (getSelectedHbCells(filter).length > 0) {
    const hbDataResponse = await fetchHbData(token, filter, metadata);
    if (isCancelled() || hbDataResponse.status === 'aborted') {
      return { status: 'aborted' };
    }
    if (hbDataResponse.status === 'error') {
      return hbDataResponse;
    }
    if(hbDataResponse.json && hbDataResponse.json.result) {
      hbData = hbDataResponse.json.result.destinations
        || hbDataResponse.json.result.origins
        || [];
    }
  }

  // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = createFeatureCollection(filter, geometriesForUser.geometries, hbData);

  // The map style may still be loading right after a page load
  const canRender = await waitUntilMapLayersMutable(map, isCancelled);
  if (isCancelled()) return { status: 'aborted' };
  if (! canRender) {
    return { status: 'error', message: 'De kaart is nog niet klaar om het raster te tonen' };
  }

  // Render hexes (sources are updated in place if they already exist)
  renderPolygons_fill(map, featureCollection, filter);
  // Render outline border
  renderPolygons_border(map, featureCollection, filter);
  // Render percentages inside the polygons
  renderPercentageValues(map, featureCollection, filter);

  return {
    status: 'ok',
    stats: getHbRenderStats(featureCollection, false)
  };
}

export {
  renderGeometriesGrid
}
