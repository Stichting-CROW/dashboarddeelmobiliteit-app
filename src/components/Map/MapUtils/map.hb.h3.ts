import h3, {latLngToCell, polygonToCells} from 'h3-js';// https://github.com/uber/h3-js/blob/master/README.md#core-functions
import geojson2h3 from 'geojson2h3';

import { canMutateMapLayers } from './mapGuards';

import {
  fetchHbData,
  renderPolygons_fill,
  renderPolygons_border,
  renderPercentageValues,
  removeH3Grid,
  getHbRenderStats,
  getSelectedHbCells,
  waitUntilMapLayersMutable,
  HbRenderOptions,
  HbRenderResult,
  HbRenderStats
} from './map.hb';

type HexagonType = any;

type AccessibleHexesResult =
  | { status: 'ok'; hexes: string[]; allAccessible: boolean }
  | { status: 'error'; message: string; httpStatus?: number };

// OD data of the last successful render, used to redraw the grid when the
// viewport changes without fetching again.
let lastRender: { allAccessible: boolean; hbData: HexagonType[] } | null = null;

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
        cell: hex,
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
const getHexesForUser = async (
  map,
  token,
  filter
): Promise<AccessibleHexesResult> => {
  // Get hexes user has access to
  const url = encodeURI(`${process.env.REACT_APP_MAIN_API_URL}/od-api/accessible/h3?h3_resolution=${filter.h3niveau}${filter.gebied ? '&filter_municipalities=' + filter.gebied : ''}`);

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
        message: `Toegankelijke vlakken ophalen mislukt (HTTP ${httpStatus})`,
        httpStatus
      };
    }
    responseJson = await response.json();
  } catch(e) {
    console.error(e);
    return {
      status: 'error',
      message: 'Toegankelijke vlakken ophalen mislukt (netwerkfout)'
    };
  }

  // Validate
  if(! responseJson || ! responseJson.result) {
    console.error('No valid response json returned for getting accessible h3 hexes')
    return {
      status: 'error',
      message: 'Ongeldig antwoord bij ophalen van toegankelijke vlakken',
      httpStatus
    };
  }

  // If user has access to everything: the grid is the viewport (computed by
  // the caller once the map is ready)
  if(responseJson.result.all_accessible === true) {
    return { status: 'ok', hexes: [], allAccessible: true };
  }

  // Otherwise: Return all hexes available for user
  return {
    status: 'ok',
    hexes: responseJson.result.accessible_h3_cells || [],
    allAccessible: false
  };
}

const renderH3Grid = async (
  map: any,
  token: string,
  filter: any,
  metadata: any,
  options: HbRenderOptions = {}
): Promise<HbRenderResult> => {
  const isCancelled = options.isCancelled || (() => false);

  // Get hexes for map
  const hexesForUser = await getHexesForUser(map, token, filter);
  if (isCancelled()) return { status: 'aborted' };
  if (hexesForUser.status !== 'ok') {
    removeH3Grid(map);
    return hexesForUser;
  }

  // Get OD data. Without a selected cell there is nothing to relate to (the
  // API rejects an empty cell list), so only draw the empty grid then.
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

  // The map style may still be loading right after a page load
  const canRender = await waitUntilMapLayersMutable(map, isCancelled);
  if (isCancelled()) return { status: 'aborted' };
  if (! canRender) {
    return { status: 'error', message: 'De kaart is nog niet klaar om het raster te tonen' };
  }

  // For users with access to everything the grid follows the viewport, so
  // compute the viewport cells now that the map is ready (not earlier, when
  // the map may still have been at its initial position).
  const hexes = hexesForUser.allAccessible
    ? getHexesForViewPort(map, filter)
    : hexesForUser.hexes;

  // Remember the result, so the grid can follow the viewport without
  // fetching the OD data again (see rerenderH3GridForViewport).
  lastRender = {
    allAccessible: hexesForUser.allAccessible,
    hbData
  };

  // Create feature collection based on accessible hexes & hbData
  const featureCollection = createFeatureCollection(filter, hexes, hbData);

  // Render hexes (sources are updated in place if they already exist)
  renderPolygons_fill(map, featureCollection.geojson, filter);
  // Render outline border
  renderPolygons_border(map, featureCollection.geojsonForOuterBorder, filter);
  // Render percentages inside the polygons
  renderPercentageValues(map, featureCollection.geojson, filter);

  return {
    status: 'ok',
    stats: getHbRenderStats(featureCollection.geojson, hexesForUser.allAccessible)
  };
}

/**
 * Re-draw the H3 grid for the current viewport using the OD data of the last
 * render. Only applies to users with access to all cells (their grid is the
 * viewport); for others the grid is fixed. No network requests are made, so
 * this is cheap enough to run on every map move.
 *
 * Returns the stats of the re-drawn grid, or null when nothing was drawn.
 */
const rerenderH3GridForViewport = (map: any, filter: any): HbRenderStats | null => {
  if (! lastRender || ! lastRender.allAccessible) return null;
  if (filter.h3niveau !== 7 && filter.h3niveau !== 8) return null;
  if (! canMutateMapLayers(map) || ! map.getSource('h3-hexes')) return null;

  const hexes = getHexesForViewPort(map, filter);
  const featureCollection = createFeatureCollection(filter, hexes, lastRender.hbData);

  renderPolygons_fill(map, featureCollection.geojson, filter);
  renderPolygons_border(map, featureCollection.geojsonForOuterBorder, filter);
  renderPercentageValues(map, featureCollection.geojson, filter);

  return getHbRenderStats(featureCollection.geojson, true);
}

export {
  renderH3Grid,
  rerenderH3GridForViewport
}
