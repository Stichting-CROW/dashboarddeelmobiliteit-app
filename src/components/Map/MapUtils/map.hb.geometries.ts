import {
  fetchHbData,
  removeH3Sources,
  renderPolygons_fill,
  renderPolygons_border,
  renderPercentageValues
} from './map.hb';

// Get geometries for user
const getGeometriesForUser = async (map, token, filter) => {
  // Get hexes user has access to
  const url = encodeURI(`https://api.dashboarddeelmobiliteit.nl/od-api/accessible/geometry?${filter.gebied ? 'filter_municipalities=' + filter.gebied : ''}`);

  let responseJson;

  try {
    let response = await fetch(url, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${token}`
      }
    });
    responseJson = await response.json();
  } catch(e) {
    console.error(e);
  }

  // Validate
  if(! responseJson || ! responseJson.result) {
    console.error('No valid response json returned for getting accessible geometries')
    return;
  }

  // If user has access to everything: Only get h3 hexes for viewport
  // if(responseJson.result.all_accessible === true) {
  //   const h3HexesForViewport = getHexesForViewPort(map, filter);
  //   return h3HexesForViewport;
  // }

  // Otherwise: Return all hexes available for user
  return responseJson;
}

const createFeatureCollection = (allGeometries, geometriesHbData) => {
  let features = [];

  // Create features array
  allGeometries.forEach(x => {
    features.push({
      "type": "Feature",
      "id": "87196ba25ffffff",
      "properties": {
        "zone_id": x.zone_id,
        "municipality_code": x.municipality_code,
        "stats_ref": x.stats_ref
        // "value": 178,
        // "selected": 0
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
  filter: any
) => {
  // Render grid for full map
  const geometriesForUser = await getGeometriesForUser(map, token, filter)
  if(! geometriesForUser || ! geometriesForUser.result.accessible_geometries) return;  

  // Render polygons based on origins/destinations data
  const hbDataResponse = await fetchHbData(token, filter);
  if(! hbDataResponse || ! hbDataResponse.result) return;
  const hbData = hbDataResponse.result.destinations || hbDataResponse.result.origins;

  // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = createFeatureCollection(hbDataResponse.accessible_geometries, hbData.result.origins ? hbData.result.origins : hbData.result.destinations);
  console.log('featureCollection', featureCollection);

  // Remove old H3 sources first
  removeH3Sources(map);
  // Render hexes
  renderPolygons_fill(map, featureCollection, filter);
  // Render outline border
  renderPolygons_border(map, featureCollection, filter);
  // Render percentages inside the polygons
  renderPercentageValues(map, featureCollection, filter);
}

export {
  renderGeometriesGrid
}
