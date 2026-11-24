import moment from 'moment';
import maplibregl from 'maplibre-gl';
import center from '@turf/center';
import { isMapStyleUsable, canMutateMapLayers } from './mapGuards';

import {
  abortableFetch,
  appendAclOperatorsToUrl
} from '../../../poll-api/pollTools.js';

const config = ({
  lng: -122.4,
  lat: 37.7923539,
  zoom: 11.5,
  fillOpacity: 0.6,
  colorScale: ['#ffffcc', '#78c679', '#006837']
})

// Variable that will prevent simultaneous loading of fetch requests
let theFetch = null;

// CSS class set on the map container while HB data is being loaded
const HB_LOADING_CLASS = 'hb-loading';

// Opacity of the hexagon fills while the shown data is stale (loading)
const LOADING_FILL_OPACITY = 0.2;

// Whether the grid is currently shown in its dimmed "loading" state. Kept so a
// re-render for a viewport change keeps the dimmed look while data is loading.
let gridIsLoading = false;

// Stats used by the hover popup. Kept outside the listener closure so the
// listener only has to be registered once per map instance.
const hoverStats = {
  maxCount: 0,
  sumCount: 0
};
const mapsWithHoverEffect = new WeakSet<object>();

// Last geojson rendered per source, so the selection outline can be updated
// instantly (before new HB data arrives).
const lastGeojsonBySource: Record<string, any> = {};

/** Outcome of an HB fetch. Aborted requests are reported, not swallowed. */
export type HbFetchResult =
  | { status: 'ok'; json: any }
  | { status: 'aborted' }
  | { status: 'error'; message: string; httpStatus?: number };

/** Aggregated numbers shown to the user after a successful HB render. */
export interface HbRenderStats {
  total_trips: number;
  cells_with_trips: number;
  cell_count: number;
  /** True when the grid is the map viewport (zooming/panning changes it) */
  viewport_based: boolean;
}

/** Outcome of a full HB render (accessible cells + OD data + map layers). */
export type HbRenderResult =
  | { status: 'ok'; stats: HbRenderStats }
  | { status: 'aborted' }
  | { status: 'error'; message: string; httpStatus?: number };

export interface HbRenderOptions {
  /** Returns true when a newer render superseded this one */
  isCancelled?: () => boolean;
}

/** Cells selected for the active detail level (H3 index or CBS stats_ref) */
export const getSelectedHbCells = (filter: any): string[] => {
  if (!filter) return [];
  if (filter.h3niveau === 'wijk') return filter.h3hexeswijk || [];
  if (filter.h3niveau === 7) return filter.h3hexes7 || [];
  return filter.h3hexes8 || [];
};

const getColorStops = (maxCount, herkomstbestemming) => {
  if(! maxCount || maxCount <= 0) {
    return [
      [0, '#eee'],
      [100, '#eee']
    ];
  }

  // Create color gradient: coolors.co
  const colorScale = {
    green: [
      'rgba(255, 255, 255, 0)',// 0%
      '#78c679',               // 1-10%
      '#78c679',               // 10%
      '#6eb36f',               // 20%
      '#6eb36f',               // 30%
      '#519351',
      '#368937',               // 50%
      '#287929',
      '#186319',               // 70%
      '#0e500f',               // 80%
      '#052d06',               // 90%
      '#052d06'                // 100%
    ],
    red: [
      'rgba(255, 255, 255, 0)',// 0%
      '#FE7279',
      '#FD5D65',
      '#FD4952',
      '#FD353F',
      '#FD212C',
      '#FD0D19',
      '#F2020E',
      '#DE020D',
      '#CA020C',
      '#B6020B'
    ]
  }

  const colorKey = herkomstbestemming === 'bestemming' ? 'red' : 'green';

  const getColor = (perc) => {
    if(perc < 1) return colorScale[colorKey][0];
    if(perc < 10) return colorScale[colorKey][1];
    if(perc < 20) return colorScale[colorKey][2];
    if(perc < 30) return colorScale[colorKey][3];
    if(perc < 40) return colorScale[colorKey][4];
    if(perc < 50) return colorScale[colorKey][5];
    if(perc < 60) return colorScale[colorKey][6];
    if(perc < 70) return colorScale[colorKey][7];
    if(perc < 80) return colorScale[colorKey][8];
    if(perc < 90) return colorScale[colorKey][9];
    if(perc <= 100) return colorScale[colorKey][10];
  }

  let colorStops = [
    [0, getColor(0)]
  ];
  for(let i: number = (maxCount*0.1); i <= maxCount; i+=(maxCount*0.1)) {
    colorStops.push([i, getColor(i / maxCount * 100)])
  }

  return colorStops;
}

// Find symbol layer, so we can place layers below it (z-index)
// Source: https://maplibre.org/maplibre-gl-js-docs/example/geojson-layer-in-stack/
const findSymbolLayer = (map) => {
  var layers = map.getStyle().layers;
  // Find the index of the first symbol layer in the map style
  var firstSymbolId;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
      firstSymbolId = layers[i].id;
      break;
    }
  }
  return '';// Disable
  return firstSymbolId;
}

// const exampleHexagons = {
//   '88283082a3fffff': 0.23360022663054658,
//   '88283082a1fffff': 0.5669828486310873
// }

const fetchHbData = async (
  token: string,
  filter: any,
  metadata?: any
): Promise<HbFetchResult> => {
  // Abort previous fetch
  if(theFetch) {
    theFetch.abort();
  }

  const getFetchOptions = () => {
    return {
      headers: {
        "authorization": `Bearer ${token}`,
        'mode':'no-cors'
      }
    }
  }

  // Get the modalities that are active
  const allModalities = ['cargo_bicycle', 'moped', 'bicycle', 'car', 'scooter', 'unknown'];
  const excludedModalities = filter.voertuigtypesexclude;
  const includedModalities = allModalities.filter(x => excludedModalities.split(',').indexOf(x) <= -1);

  // Get API response
  let url = `${process.env.REACT_APP_MAIN_API_URL}/od-api/${filter.herkomstbestemming === 'bestemming' ? 'destinations' : 'origins'}/${filter.h3niveau === 'wijk' ? 'geometry' : 'h3'}`+
              (filter.h3niveau === 7 || filter.h3niveau === 8 ? `?h3_resolution=${filter.h3niveau || 8}` : '')+
              (filter.h3niveau === 'wijk' ? `?${filter.herkomstbestemming === 'bestemming' ? 'origin' : 'destination'}_stat_refs=${filter.h3hexeswijk}` : '')+
              `&start_date=${moment(filter.ontwikkelingvan).format('YYYY-MM-DD')}`+
              `&end_date=${moment(filter.ontwikkelingtot).format('YYYY-MM-DD')}`+
              `&time_periods=${filter.timeframes || '6-10,10-14,14-18,18-22,22-2,2-6'}`+
              `&days_of_week=${filter.weekdays || 'fr,th,mo,tu,we,sa,su'}`+
              `&modalities=${includedModalities}`+
              (filter.herkomstbestemming === 'bestemming'
                ? `&origin_cells=${filter.h3niveau === 7 ? filter.h3hexes7.join(',') : filter.h3hexes8.join(',')}`
                : `&destination_cells=${filter.h3niveau === 7 ? filter.h3hexes7.join(',') : filter.h3hexes8.join(',')}`);
  url = appendAclOperatorsToUrl(url, metadata);
  const encodedUrl = encodeURI(url);

  const thisFetch = abortableFetch(encodedUrl, getFetchOptions());
  theFetch = thisFetch;

  try {
    const response = await thisFetch.ready;
    if(! response.ok) {
      return {
        status: 'error',
        message: `HB-data ophalen mislukt (HTTP ${response.status})`,
        httpStatus: response.status
      };
    }
    const json = await response.json();
    return { status: 'ok', json };
  } catch(e: any) {
    if(e && e.name === 'AbortError') {
      return { status: 'aborted' };
    }
    console.error(e);
    return {
      status: 'error',
      message: 'HB-data ophalen mislukt (netwerkfout)'
    };
  } finally {
    // Only clear when no newer fetch replaced this one
    if(theFetch === thisFetch) {
      theFetch = null;
    }
  }
}

/**
 * Visually mark the HB grid as "stale, new data is loading": dim the fills
 * and labels and switch the map cursor to a progress cursor.
 */
const setH3GridLoadingState = (map: any, isLoading: boolean) => {
  if (!map) return;

  gridIsLoading = isLoading;

  try {
    const container = map.getContainer && map.getContainer();
    if (container && container.classList) {
      container.classList.toggle(HB_LOADING_CLASS, isLoading);
    }
  } catch {
    // Map may be torn down
  }

  if (!canMutateMapLayers(map)) return;

  try {
    if (map.getLayer('h3-hexes-layer-fill')) {
      map.setPaintProperty(
        'h3-hexes-layer-fill',
        'fill-opacity',
        isLoading ? LOADING_FILL_OPACITY : config.fillOpacity
      );
    }
    if (map.getLayer('h3-hexes-percentageValues-layer')) {
      map.setPaintProperty(
        'h3-hexes-percentageValues-layer',
        'text-opacity',
        isLoading ? 0.3 : 1
      );
    }
    if (map.getLayer('h3-hex-areas-layer')) {
      map.setPaintProperty(
        'h3-hex-areas-layer',
        'line-opacity',
        isLoading ? 0.3 : 1
      );
    }
  } catch {
    // Map may be torn down
  }
}

/**
 * Instantly outline the selected cells on the already rendered grid, so a
 * click gets immediate feedback while the new HB data is still loading.
 * Cells are matched on `properties.cell` (H3 index or CBS stats_ref).
 */
const updateSelectedCells = (map: any, selectedCells: string[]) => {
  if (!canMutateMapLayers(map)) return;

  const selected = new Set((selectedCells || []).map(String));

  ['h3-hexes', 'h3-hex-areas'].forEach((sourceId) => {
    const geojson = lastGeojsonBySource[sourceId];
    if (!geojson || !Array.isArray(geojson.features)) return;

    let changed = false;
    geojson.features.forEach((feature: any) => {
      if (!feature.properties || feature.properties.cell === undefined) return;
      const isSelected = selected.has(String(feature.properties.cell)) ? 1 : 0;
      if (feature.properties.selected !== isSelected) {
        feature.properties.selected = isSelected;
        changed = true;
      }
    });
    if (!changed) return;

    try {
      const source = map.getSource(sourceId);
      if (source && source.setData) {
        source.setData(geojson);
      }
    } catch {
      // Map may be torn down
    }
  });
}

const removeH3Sources = (map: any) => {
  // Early return if map is null or undefined
  if (!map) return;
  
  let layer;
  let key, source;
  
  key = 'h3-hexes';
  source = map.getSource(key);
  if(source) map.removeSource(key);

  key = 'h3-hex-areas';
  source = map.getSource(key);
  if(source) map.removeSource(key);
}

const removeH3Grid = (map: any) => {
  if (!isMapStyleUsable(map)) return;

  try {
    let layer, key;

    key = 'h3-hexes-layer-fill';
    layer = map.getLayer(`${key}`);
    if (layer) map.removeLayer(`${key}`);

    key = 'h3-hexes-layer-border';
    layer = map.getLayer(`${key}`);
    if (layer) map.removeLayer(`${key}`);

    key = 'h3-hexes';
    layer = map.getLayer(`${key}-layer`);
    if (layer) map.removeLayer(`${key}-layer`);

    key = 'h3-hex-areas';
    layer = map.getLayer(`${key}-layer`);
    if (layer) map.removeLayer(`${key}-layer`);

    key = 'h3-hexes-percentageValues';
    layer = map.getLayer(`${key}-layer`);
    if (layer) map.removeLayer(`${key}-layer`);

    removeH3Sources(map);
  } catch {
    // Map may already be torn down during route navigation.
  }
}

const getAggregatedStats = (geojson: any) => {
  let maxCount: number = 0;
  let sumCount: number = 0;
  Object.values(geojson.features).forEach((x: any) => {
    const value = x.properties.value;
    sumCount += value;
    if(value > maxCount) {
      maxCount = value;
    }
  });
  return {
    maxCount: maxCount,
    sumCount: sumCount
  };
} 

/**
 * Resolve with true once layers/sources can be added to the map, or false
 * when the render was cancelled or the map was removed.
 *
 * There is deliberately no timeout: MapLibre finishes loading its style in a
 * requestAnimationFrame callback, which browsers pause for background tabs.
 * A user who opens the page in a background tab should still get the grid
 * (not an error) once they switch to the tab.
 */
const waitUntilMapLayersMutable = (
  map: any,
  isCancelled: () => boolean = () => false
): Promise<boolean> => {
  return new Promise((resolve) => {
    const check = () => {
      if (isCancelled()) return resolve(false);
      if (!map || map._removed) return resolve(false);
      if (canMutateMapLayers(map)) return resolve(true);
      setTimeout(check, 100);
    };
    check();
  });
}

function renderPolygons_fill(map, geojson, filter) {
  // Get highest hex value
  const {maxCount, sumCount} = getAggregatedStats(geojson);
  hoverStats.maxCount = maxCount;
  hoverStats.sumCount = sumCount;

  const sourceId = 'h3-hexes';
  let layerId = `${sourceId}-layer-fill`
    , source = map.getSource(sourceId);

  lastGeojsonBySource[sourceId] = geojson;

  // Add the source if we haven't created them yet
  if (! source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      generateId: true // This ensures that all features have unique IDs
    });

    // Set source variable
    source = map.getSource(sourceId);
  }
  // If source was already present: Update data
  else {
    source.setData(geojson);
  }
  if (! map.getLayer(layerId)) {
    // Add hexes (fill + 1px outline)
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'fill',
      // interactive: false,// <- What's this?
    }, findSymbolLayer(map));
  }
  
  // Update the fill layer paint properties, using the current config values
  map.setPaintProperty(layerId, 'fill-color', {
    property: 'value',
    stops: getColorStops(maxCount, filter.herkomstbestemming)
  });
  
  // Set opacity (keep the dimmed look if new data is still loading)
  map.setPaintProperty(
    layerId,
    'fill-opacity',
    gridIsLoading ? LOADING_FILL_OPACITY : config.fillOpacity
  );

  // Add line layer for wider outline/borders, on top of fill layer
  // Info here: https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness/50372832#50372832
  layerId = `${sourceId}-layer-border`;
  if (! map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'line',
      // interactive: true,// <- What's this?
      paint: {
        'line-color': [
          "case",
          ["==", ["get", "selected"], 1], '#15aeef',
          ["boolean", ["feature-state", "hover"], false], '#666',
          '#DDD'
        ],
        'line-width': [
          "case",
          ["==", ["get", "selected"], 1], 5,
          ["boolean", ["feature-state", "hover"], false], 2,
          1
        ]
      }
    }, findSymbolLayer(map));
  }

  // Create hover effect (hovering fills). Listeners live on the map object,
  // so register them only once per map instance.
  if (! mapsWithHoverEffect.has(map)) {
    mapsWithHoverEffect.add(map);
    createHoverEffect(map, 'h3-hexes-layer-fill');
  }
}

function renderPolygons_border(map, geojson, filter) {
 
  const sourceId = 'h3-hex-areas';
  const layerId = `${sourceId}-layer`;
  let source = map.getSource(sourceId);

  lastGeojsonBySource[sourceId] = geojson;

  // Add the source and layer if we haven't created them yet
  if (!source) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      generateId: true
    });
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'line',
      // interactive: false,
      paint: {
        'line-width': 3,
        'line-color': [
          "case",
          ["==", ["get", "selected"], 1], '#15aeef',
          ["boolean", ["feature-state", "hover"], false], '#666',
          (filter.herkomstbestemming === 'bestemming' ? '#F4010D' : config.colorScale[2])
        ]
      }
    }, findSymbolLayer(map));
    source = map.getSource(sourceId);
  }
  // Update paint properties as well if source was available already
  else {
    map.setPaintProperty(layerId, 'line-color', [
      "case",
      ["==", ["get", "selected"], 1], '#15aeef',
      ["boolean", ["feature-state", "hover"], false], '#666',
      (filter.herkomstbestemming === 'bestemming' ? '#F4010D' : config.colorScale[2])
    ]);
  }

  // Update the geojson data
  source.setData(geojson);
}
function renderPercentageValues(map, geojson, filter) {
  const sourceId = 'h3-hexes';
  const layerId = `${sourceId}-percentageValues-layer`;

  // Data lives in the shared 'h3-hexes' source, so the layer only has to be
  // added once; setData() on the source updates the labels.
  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, 'text-opacity', gridIsLoading ? 0.3 : 1);
    return;
  }

  map.addLayer({
    "id": layerId,
    "type": "symbol",
    "source": sourceId,
    "minzoom": 11,
    "layout": {
      'text-field': ["case",
        [">", ["get", "value"], 0], ['get', 'value'], ""
      ],
      "text-font": [
        "DIN Offc Pro Medium",
        "Arial Unicode MS Bold"
      ],
      "text-size": 12,
      // 'text-offset': [0, 1.25],
      // 'text-anchor': 'top'
    }
  });
}

// Create a popup to be used on offer
const popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false
});

// https://maplibre.org/maplibre-gl-js-docs/example/hover-styles/
// https://maplibre.org/maplibre-gl-js-docs/example/popup-on-hover/
const createHoverEffect = (map, layerId) => {
  var hoveredStateId = null;

  // When the user moves their mouse over the state-fill layer, we'll update the
  // feature state for the feature under the mouse.
  map.on('mousemove', layerId, function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    // Read the stats of the most recent render (see renderPolygons_fill)
    const { maxCount, sumCount } = hoverStats;

    const coordinates = e.features[0].geometry.coordinates.slice();
    const percentageColorFill: number = e.features[0].properties.value / maxCount * 100;
    const percentageOfTotal: number = e.features[0].properties.value / sumCount * 100;
    // sumCount
    const description = `${e.features[0].properties.value} (${percentageOfTotal.toFixed(1)}%)`;
    const lngLat = e.lngLat;

    // Populate the popup and set its coordinates
    // based on the feature found.
    if(percentageColorFill > 0) {
      popup.setLngLat(lngLat).setHTML(description).addTo(map);
    }

    if (hoveredStateId) {
      map.setFeatureState(
        { source: 'h3-hexes', id: hoveredStateId },
        { hover: false }
      );
      map.setFeatureState(
        { source: 'h3-hex-areas', sourceLayer: 'h3-hex-areas-layer', id: hoveredStateId },
        { hover: false }
      );
    }

    // Set 'hover' flag
    hoveredStateId = e.features[0].id;
    map.setFeatureState(
      { source: 'h3-hexes', id: hoveredStateId },
      { hover: true }
    );
    map.setFeatureState(
      { source: 'h3-hex-areas', sourceLayer: 'h3-hex-areas-layer', id: hoveredStateId },
      { hover: true }
    );
  });
   
  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', layerId, function () {
    map.getCanvas().style.cursor = '';
    popup.remove();

    // Unhover
    if (hoveredStateId) {
      map.setFeatureState(
        { source: 'h3-hexes', id: hoveredStateId },
        { hover: false }
      );
      map.setFeatureState(
        { source: 'h3-hex-areas', sourceLayer: 'h3-hex-areas-layer', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
  });
}

/** Sum/max of a rendered feature collection, for the status widget */
const getHbRenderStats = (geojson: any, viewportBased: boolean): HbRenderStats => {
  const { sumCount } = getAggregatedStats(geojson);
  const features = Object.values(geojson.features || {}) as any[];
  return {
    total_trips: sumCount,
    cells_with_trips: features.filter((x) => x.properties.value > 0).length,
    cell_count: features.length,
    viewport_based: viewportBased
  };
}

export {
  removeH3Sources,
  fetchHbData,
  removeH3Grid,
  renderPolygons_fill,
  renderPolygons_border,
  renderPercentageValues,
  setH3GridLoadingState,
  updateSelectedCells,
  getHbRenderStats,
  waitUntilMapLayersMutable
}
