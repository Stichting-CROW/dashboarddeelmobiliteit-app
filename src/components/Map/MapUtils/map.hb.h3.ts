import h3, {latLngToCell, polygonToCells} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions
import geojson2h3 from 'geojson2h3';

import {
  fetchHbData,
  removeH3Sources,
  renderPolygons_fill,
  renderPolygons_border,
  renderPercentageValues,
  removeH3Grid
} from './map.hb';

type HexagonType = any;

// Get geometries for user
const getGeometriesForUser = async (map, token, filter) => {
  // Get hexes user has access to
  const url = encodeURI(`${process.env.REACT_APP_MAIN_API_URL}/od-api/accessible/geometry?${filter.gebied ? 'filter_municipalities=' + filter.gebied : ''}`);

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

  // Otherwise: Return all hexes available for user
  return responseJson;
}

const createFeatureCollection = (filter, allHexes, geometriesHbData) => {
  let features = [];

  /*
   * Create geojson for all empty hexes
   */
  // Create hexagon feature set
  let hexagonsAsArray = [];
  allHexes.forEach((x) => {
    hexagonsAsArray[x] = 0;
  });

  /*
   * Create geojson for all filled hexes
   */
  // Get selected h3 hexe(s) from state
  const selectedH3Hexes = (filter.h3niveau && filter.h3niveau === 8) ? filter.h3hexes8 : filter.h3hexes7;

  // Add data value to hexes
  geometriesHbData.forEach((x: HexagonType) => {
    hexagonsAsArray[x.cell] = x.number_of_trips;
  });
  // Transform the hexagons into a GeoJSON object
  const geojson = geojson2h3.h3SetToFeatureCollection(
    Object.keys(hexagonsAsArray),
    hex => {
      return {
        value: hexagonsAsArray[hex],
        selected: selectedH3Hexes.indexOf(hex) > -1 ? 1 : 0
      }
    }
  );

  // Create a geojson polygon for the outline border
  const threshold = 0.75;
  const geojsonForOuterBorder = geojson2h3.h3SetToFeature(
    Object.keys(hexagonsAsArray).filter(hex => hexagonsAsArray[hex] > threshold)
  );

  return {
    geojson,
    geojsonForOuterBorder
  }
}

// Get hexes for map viewport
const getHexesForViewPort = (map, filter) => {
  // If zoom level is less than 9, don't render hex grid for viewport
  // (because otherwise it's to resourcefull)
  if(map.getZoom() < 9) return [];

  const { _sw: sw, _ne: ne} = map.getBounds();
  const boundsPolygon =[
      [ sw.lat, sw.lng ],
      [ ne.lat, sw.lng ],
      [ ne.lat, ne.lng ],
      [ sw.lat, ne.lng ],
      [ sw.lat, sw.lng ],
  ];
  const hexes = polygonToCells(boundsPolygon, filter.h3niveau);

  return hexes;
}

// Get hexes for user
const getHexesForUser = async (map, token, filter) => {
  // Get hexes user has access to
  const url = encodeURI(`${process.env.REACT_APP_MAIN_API_URL}/od-api/accessible/h3?h3_resolution=${filter.h3niveau}${filter.gebied ? '&filter_municipalities=' + filter.gebied : ''}`);

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
    console.error('No valid response json returned for getting accessible h3 hexes')
    return;
  }

  // If user has access to everything: Only get h3 hexes for viewport
  if(responseJson.result.all_accessible === true) {
    const h3HexesForViewport = getHexesForViewPort(map, filter);
    return h3HexesForViewport;
  }

  // Otherwise: Return all hexes available for user
  return responseJson.result.accessible_h3_cells;
}

const renderH3Grid = async (
  map: any,
  token: string,
  filter: any
) => {
  let features = [];

  // Get hexes for map
  const hexesForUser = await getHexesForUser(map, token, filter);

  // Get OD data
  let hbData;
  const hbDataResponse = await fetchHbData(token, filter);
  if(hbDataResponse && hbDataResponse.result) {
    hbData = hbDataResponse.result.destinations || hbDataResponse.result.origins;
  }

  // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = createFeatureCollection(filter, hexesForUser, hbData || []);

  // Remove old H3 sources first
  removeH3Sources(map);
  // Render hexes
  renderPolygons_fill(map, featureCollection.geojson, filter);
  // Render outline border
  renderPolygons_border(map, featureCollection.geojsonForOuterBorder, filter);
  // Render percentages inside the polygons
  renderPercentageValues(map, featureCollection.geojson, filter);
}

export {
  renderH3Grid
}
