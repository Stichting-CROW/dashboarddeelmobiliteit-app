import baseStyle from '../MapStyles/base.js';
import nine3030Style from '../MapStyles/nine3030.js';
import md5 from 'md5';
import {layers} from '../layers/index.js';
import {addSources} from './sources.js';
import {
  addLayers,
  activateLayers
} from './layers.js';

// Cache for map styles to avoid repeated fetches
const styleCache = new Map();

export const getMapStyles = () => {
  return {
    // NOTE: mapbox:// urls are not supported anymore.
    // See https://github.com/maplibre/maplibre-gl-js/issues/1225#issuecomment-1118769488
    base: nine3030Style,
    satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=ZH8yI08EPvuzF57Lyc61'
  }
}

export const setBackgroundLayer = (map, name, setMapStyle) => {
  // Check if setMapStyle func was given
  if(! setMapStyle) {
    console.error('setMapStyle not given');
    return;
  }

  // Check if map style was loaded
  if(! map.isStyleLoaded()) {
    return;
  }

  setMapStyle(name);

  if(name === 'base') {
    map.U.hide('luchtfoto-pdok');
  }
  else {
    map.U.show(name);
  }
}

// Variable to keep track of the map style that we used last
let mapStyleHash = md5(getMapStyles().base);

/**
 * Set the base layer style for the map using MapLibre's native methods.
 * This is more efficient than replacing the entire map style.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string|Object} styleUrlOrObject - Style URL or style object
 * @param {Object} options - Additional options
 * @param {boolean} options.preserveLayers - Whether to preserve existing layers (default: true)
 * @param {boolean} options.preserveSources - Whether to preserve existing sources (default: true)
 * @returns {Promise<void>}
 */
export const setBaseLayer = async (map, styleUrlOrObject, options = {}) => {
  if (!map) return;
  if (!map.isStyleLoaded()) return;
  if (!styleUrlOrObject) return;

  const {
    preserveLayers = true,
    preserveSources = true
  } = options;

  const newMapStyleHash = md5(styleUrlOrObject);
  if (mapStyleHash === newMapStyleHash) {
    return;
  }
  mapStyleHash = newMapStyleHash;

  try {
    let newStyle = styleUrlOrObject;
    
    // If style URL was given: fetch JSON
    if (typeof styleUrlOrObject === 'string') {
      // Check cache first
      if (styleCache.has(styleUrlOrObject)) {
        newStyle = styleCache.get(styleUrlOrObject);
      } else {
        const response = await fetch(styleUrlOrObject);
        if (!response.ok) {
          throw new Error(`Failed to fetch style: ${response.statusText}`);
        }
        const responseJson = await response.json();
        newStyle = responseJson;
        // Cache the style
        styleCache.set(styleUrlOrObject, newStyle);
      }
    }

    const currentStyle = map.getStyle();
    
    if (preserveSources) {
      // Merge sources from current style with new style
      newStyle.sources = {
        ...newStyle.sources,
        ...currentStyle.sources
      };
    }

    if (preserveLayers) {
      // Get current application layers (DD layers and gl-draw layers)
      const appLayers = currentStyle.layers.filter((layer) => {
        return layers[layer.id] || layer.id.indexOf('gl-draw-') > -1;
      });

      // Remove application layers from new style to prevent duplicates
      newStyle.layers = newStyle.layers.filter((layer) => {
        return !layers[layer.id] && layer.id.indexOf('gl-draw-') <= -1;
      });

      // Add application layers back to the new style
      newStyle.layers = [...newStyle.layers, ...appLayers];
    }

    // Set the new style
    await map.setStyle(newStyle);
    
  } catch (error) {
    console.error('Error setting base layer:', error);
    throw error;
  }
};

/**
 * Add a raster layer as a base layer overlay.
 * This is useful for adding satellite imagery on top of existing base layers.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} layerId - Unique identifier for the layer
 * @param {string} sourceUrl - URL for the raster tiles
 * @param {Object} options - Additional options
 * @param {number} options.opacity - Layer opacity (0-1, default: 1)
 * @param {number} options.minZoom - Minimum zoom level (default: 0)
 * @param {number} options.maxZoom - Maximum zoom level (default: 22)
 * @param {string} options.attribution - Attribution text
 * @returns {Promise<void>}
 */
export const addRasterBaseLayer = async (map, layerId, sourceUrl, options = {}) => {
  if (!map || !map.isStyleLoaded()) return;

  const {
    opacity = 1,
    minZoom = 0,
    maxZoom = 22,
    attribution = ''
  } = options;

  try {
    // Add the source
    map.addSource(layerId, {
      type: 'raster',
      tiles: [sourceUrl],
      tileSize: 256,
      minzoom: minZoom,
      maxzoom: maxZoom,
      attribution: attribution
    });

    // Add the layer
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: layerId,
      paint: {
        'raster-opacity': opacity
      }
    }, map.getStyle().layers[0]?.id); // Insert at the beginning

  } catch (error) {
    console.error('Error adding raster base layer:', error);
    throw error;
  }
};

/**
 * Remove a raster base layer.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} layerId - Layer identifier to remove
 */
export const removeRasterBaseLayer = (map, layerId) => {
  if (!map || !map.isStyleLoaded()) return;

  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }
  } catch (error) {
    console.error('Error removing raster base layer:', error);
  }
};

/**
 * Toggle between different base layer styles.
 * This is a convenience function that handles the common case of switching
 * between base and satellite styles.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} styleName - Style name ('base' or 'satellite')
 * @returns {Promise<void>}
 */
export const toggleBaseLayer = async (map, styleName) => {
  if (!map) return;

  const mapStyles = getMapStyles();
  const targetStyle = mapStyles[styleName];

  if (!targetStyle) {
    console.error(`Unknown style name: ${styleName}`);
    return;
  }

  await setBaseLayer(map, targetStyle);
};

/**
 * Advanced base layer management using MapLibre's native layer operations.
 * This approach is more efficient as it doesn't replace the entire map style.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} baseLayerType - Type of base layer ('terrain', 'satellite', 'hybrid', 'custom')
 * @param {Object} options - Configuration options
 * @param {string} [options.customStyleUrl] - Custom style URL for 'custom' type
 * @param {number} [options.opacity=1] - Layer opacity (0-1)
 * @param {boolean} [options.preserveOverlays=true] - Whether to preserve overlay layers
 * @returns {Promise<void>}
 */
export const setAdvancedBaseLayer = async (map, baseLayerType, options = {}) => {
  if (!map || !map.isStyleLoaded()) return;

  const {
    customStyleUrl,
    opacity = 1,
    preserveOverlays = true
  } = options;

  try {
    const currentStyle = map.getStyle();
    
    // Define base layer configurations
    const baseLayerConfigs = {
      default: {
        source: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        },
        layer: {
          type: 'raster',
          paint: {
            'raster-opacity': opacity
          }
        }
      },
      base: {
        // Use the default nine3030Style (complete style replacement)
        useCompleteStyle: true,
        style: nine3030Style
      },
      terrain: {
        // Use a simplified version of the base style
        source: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        },
        layer: {
          type: 'raster',
          paint: {
            'raster-opacity': opacity
          }
        }
      },
      satellite: {
        // Use complete style replacement for satellite to ensure no vector layers remain
        useCompleteStyle: true,
        style: {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.png'],
              tileSize: 256,
              // minzoom: 12,
              attribution: 'Kaartgegevens: <a href="https://www.pdok.nl/-/nu-hoge-resolutie-luchtfoto-2023-bij-pdok">PDOK</a>'
            }
          },
          layers: [
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'satellite',
              paint: {
                'raster-opacity': opacity
              }
            }
          ]
        }
      },
      hybrid: {
        // Use complete style replacement for hybrid to combine PDOK satellite with vector overlays
        useCompleteStyle: true,
        style: {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.png'],
              tileSize: 256,
              // minzoom: 12,
              attribution: 'Kaartgegevens: <a href="https://www.pdok.nl/-/nu-hoge-resolutie-luchtfoto-2023-bij-pdok">PDOK</a>'
            },
            composite: {
              type: 'vector',
              attribution: 'Mapbox',
              tiles: ['https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiYmFydHdyIiwiYSI6ImNsaXVqYnoybTE1ZGQzZW90YXNwNXE0YTMifQ.xdC_OTxwV95tNVjovRv9yg']
            },
            'place-labels': {
              type: 'vector',
              attribution: '© OpenStreetMap contributors',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.pbf']
            }
          },
          sprite: "https://api.mapbox.com/styles/v1/bartwr/cl8yy2i2c000014lk0s7mnr7e/draft/sprite@2x.json?access_token=tk.eyJ1IjoiYmFydHdyIiwiZXhwIjoxNjY1MTc5MTQ4LCJpYXQiOjE2NjUxNzU1NDgsInNjb3BlcyI6WyJlc3NlbnRpYWxzIiwic2NvcGVzOmxpc3QiLCJtYXA6cmVhZCIsIm1hcDp3cml0ZSIsInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiLCJ1cGxvYWRzOnJlYWQiLCJ1cGxvYWRzOmxpc3QiLCJ1cGxvYWRzOndyaXRlIiwic3R5bGVzOnRpbGVzIiwic3R5bGVzOnJlYWQiLCJmb250czpsaXN0IiwiZm9udHM6cmVhZCIsImZvbnRzOndyaXRlIiwic3R5bGVzOndyaXRlIiwic3R5bGVzOmxpc3QiLCJzdHlsZXM6ZG93bmxvYWQiLCJzdHlsZXM6cHJvdGVjdCIsInRva2VuczpyZWFkIiwidG9rZW5zOndyaXRlIiwiZGF0YXNldHM6bGlzdCIsImRhdGFzZXRzOnJlYWQiLCJkYXRhc2V0czp3cml0ZSIsInRpbGVzZXRzOmxpc3QiLCJ0aWxlc2V0czpyZWFkIiwidGlsZXNldHM6d3JpdGUiLCJkb3dubG9hZHM6cmVhZCIsInZpc2lvbjpyZWFkIiwidmlzaW9uOmRvd25sb2FkIiwibmF2aWdhdGlvbjpkb3dubG9hZCIsIm9mZmxpbmU6cmVhZCIsIm9mZmxpbmU6d3JpdGUiLCJzdHlsZXM6ZHJhZnQiLCJmb250czptZXRhZGF0YSIsInNwcml0ZS1pbWFnZXM6cmVhZCIsImRhdGFzZXRzOnN0dWRpbyIsImN1c3RvbWVyczp3cml0ZSIsImNyZWRlbnRpYWxzOnJlYWQiLCJjcmVkZW50aWFsczp3cml0ZSIsImFuYWx5dGljczpyZWFkIl0sImNsaWVudCI6Im1hcGJveC5jb20iLCJsbCI6MTY2NTE3NDc0MzUyOCwiaXUiOm51bGwsImVtYWlsIjoibWFpbEBiYXJ0cm9vcmRhLm5sIn0.onvMaEj0urnm2g3FFyrAVg",
          glyphs: "https://a.tiles.mapbox.com/v4/fontstack/{fontstack}/{range}.pbf?access_token=pk.eyJ1IjoiYmFydHdyIiwiYSI6ImNsaXVqYnoybTE1ZGQzZW90YXNwNXE0YTMifQ.xdC_OTxwV95tNVjovRv9yg",
          layers: [
            // Satellite base layer
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'satellite',
              paint: {
                'raster-opacity': opacity
              }
            },
            // Building outlines for better visibility
            {
              id: 'building-outline',
              type: 'line',
              metadata: {
                'mapbox:featureComponent': 'building',
                'mapbox:group': 'Building, building'
              },
              source: 'composite',
              'source-layer': 'building',
              minzoom: 13,
              filter: ['==', ['get', 'underground'], 'false'],
              layout: {},
              paint: {
                'line-color': 'hsl(35, 8%, 85%)',
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0.5,
                  16,
                  1,
                  17,
                  2
                ]
              }
            },
            // Buildings
            {
              id: 'building',
              type: 'fill',
              metadata: {
                'mapbox:featureComponent': 'building',
                'mapbox:group': 'Building, building'
              },
              source: 'composite',
              'source-layer': 'building',
              minzoom: 13,
              filter: ['==', ['get', 'underground'], 'false'],
              layout: {},
              paint: {
                'fill-color': 'hsl(35, 8%, 85%)',
                'fill-opacity': 0.3
              }
            },
            // Road labels
            {
              id: 'road-label-simple',
              type: 'symbol',
              metadata: {
                'mapbox:featureComponent': 'road-network',
                'mapbox:group': 'Road network, road-labels'
              },
              source: 'composite',
              'source-layer': 'road',
              minzoom: 12,
              filter: [
                'match',
                ['get', 'class'],
                [
                  'motorway',
                  'trunk',
                  'primary',
                  'secondary',
                  'tertiary',
                  'street',
                  'street_limited'
                ],
                true,
                false
              ],
              layout: {
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10,
                  [
                    'match',
                    ['get', 'class'],
                    [
                      'motorway',
                      'trunk',
                      'primary',
                      'secondary',
                      'tertiary'
                    ],
                    10,
                    9
                  ],
                  18,
                  [
                    'match',
                    ['get', 'class'],
                    [
                      'motorway',
                      'trunk',
                      'primary',
                      'secondary',
                      'tertiary'
                    ],
                    16,
                    14
                  ]
                ],
                'text-max-angle': 30,
                'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
                'symbol-placement': 'line',
                'text-padding': 1,
                'text-rotation-alignment': 'map',
                'text-pitch-alignment': 'viewport',
                'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
                'text-letter-spacing': 0.01
              },
              paint: {
                'text-color': 'hsl(0, 0%, 100%)',
                'text-halo-color': 'hsl(0, 0%, 0%)',
                'text-halo-width': 2
              }
            },
            // POI labels
            {
              id: 'poi-label',
              type: 'symbol',
              metadata: {
                'mapbox:featureComponent': 'point-of-interest-labels',
                'mapbox:group': 'Point of interest labels, poi-labels'
              },
              source: 'composite',
              'source-layer': 'poi_label',
              minzoom: 6,
              filter: [
                '<=',
                ['get', 'filterrank'],
                ['+', ['step', ['zoom'], 0, 16, 1, 17, 2], 2]
              ],
              layout: {
                'text-size': [
                  'step',
                  ['zoom'],
                  ['step', ['get', 'sizerank'], 18, 5, 12],
                  17,
                  ['step', ['get', 'sizerank'], 18, 13, 12]
                ],
                'icon-image': [
                  'case',
                  ['has', 'maki_beta'],
                  [
                    'coalesce',
                    ['image', ['get', 'maki_beta']],
                    ['image', ['get', 'maki']]
                  ],
                  ['image', ['get', 'maki']]
                ],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-offset': [
                  'step',
                  ['zoom'],
                  [
                    'step',
                    ['get', 'sizerank'],
                    ['literal', [0, 0]],
                    5,
                    ['literal', [0, 0.75]]
                  ],
                  17,
                  [
                    'step',
                    ['get', 'sizerank'],
                    ['literal', [0, 0]],
                    13,
                    ['literal', [0, 0.75]]
                  ]
                ],
                'text-anchor': [
                  'step',
                  ['zoom'],
                  ['step', ['get', 'sizerank'], 'center', 5, 'top'],
                  17,
                  ['step', ['get', 'sizerank'], 'center', 13, 'top']
                ],
                'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']]
              },
              paint: {
                'icon-opacity': [
                  'step',
                  ['zoom'],
                  ['step', ['get', 'sizerank'], 0, 5, 1],
                  17,
                  ['step', ['get', 'sizerank'], 0, 13, 1]
                ],
                'text-halo-color': 'hsl(0, 0%, 0%)',
                'text-halo-width': 1.5,
                'text-halo-blur': 0.5,
                'text-color': 'hsl(0, 0%, 100%)'
              }
            },
            // Settlement labels
            {
              id: 'settlement-subdivision-label',
              type: 'symbol',
              metadata: {
                'mapbox:featureComponent': 'place-label',
                'mapbox:group': 'Place labels, settlement-subdivision-label'
              },
              source: 'composite',
              'source-layer': 'place_label',
              minzoom: 4,
              filter: [
                'all',
                ['==', ['get', 'class'], 'suburb'],
                ['==', ['get', 'worldview'], 'all']
              ],
              layout: {
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  4,
                  8,
                  10,
                  12,
                  18,
                  20
                ],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
                'text-letter-spacing': 0.01
              },
              paint: {
                'text-color': 'hsl(0, 0%, 100%)',
                'text-halo-color': 'hsl(0, 0%, 0%)',
                'text-halo-width': 2
              }
            },
            // City and town labels using OpenStreetMap data
            {
              id: 'city-label',
              type: 'symbol',
              source: 'place-labels',
              'source-layer': 'place',
              minzoom: 2,
              filter: [
                'all',
                ['has', 'name'],
                ['match', ['get', 'place'], ['city', 'town'], true, false]
              ],
              layout: {
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  2,
                  10,
                  6,
                  14,
                  10,
                  18,
                  18,
                  24
                ],
                'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                'text-field': ['get', 'name'],
                'text-letter-spacing': 0.01
              },
              paint: {
                'text-color': 'hsl(0, 0%, 100%)',
                'text-halo-color': 'hsl(0, 0%, 0%)',
                'text-halo-width': 3
              }
            },
            // Village and smaller settlement labels
            {
              id: 'village-label',
              type: 'symbol',
              source: 'place-labels',
              'source-layer': 'place',
              minzoom: 4,
              filter: [
                'all',
                ['has', 'name'],
                ['match', ['get', 'place'], ['village', 'hamlet', 'suburb'], true, false]
              ],
              layout: {
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  4,
                  8,
                  8,
                  12,
                  12,
                  16,
                  16,
                  20
                ],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-field': ['get', 'name'],
                'text-letter-spacing': 0.01
              },
              paint: {
                'text-color': 'hsl(0, 0%, 100%)',
                'text-halo-color': 'hsl(0, 0%, 0%)',
                'text-halo-width': 2
              }
            },
            // Country labels for very zoomed out views
            {
              id: 'country-label',
              type: 'symbol',
              source: 'place-labels',
              'source-layer': 'place',
              minzoom: 0,
              filter: [
                'all',
                ['has', 'name'],
                ['==', ['get', 'place'], 'country']
              ],
              layout: {
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  0,
                  12,
                  4,
                  16,
                  8,
                  20,
                  12,
                  24
                ],
                'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                'text-field': ['get', 'name'],
                'text-letter-spacing': 0.02
              },
              paint: {
                'text-color': 'hsl(0, 0%, 100%)',
                'text-halo-color': 'hsl(0, 0%, 0%)',
                'text-halo-width': 4
              }
            }
          ]
        }
      }
    };

    // Get the configuration for the requested base layer type
    let config = baseLayerConfigs[baseLayerType];
    
    // Special handling for base, satellite, and hybrid (uses complete style replacement)
    if (baseLayerType === 'base') {
      // Use the complete base style instead of just a single layer
      // This provides the full vector tile styling with all layers
      config = {
        useCompleteStyle: true,
        style: nine3030Style
      };
    } else if (baseLayerType === 'satellite') {
      // Use complete style replacement for satellite to ensure no vector layers remain
      config = {
        useCompleteStyle: true,
        style: config.style
      };
    } else if (baseLayerType === 'hybrid') {
      // Use complete style replacement for hybrid to combine PDOK satellite with vector overlays
      config = {
        useCompleteStyle: true,
        style: config.style
      };
    }
    
    if (baseLayerType === 'custom') {
      if (!customStyleUrl) {
        throw new Error('customStyleUrl is required when baseLayerType is "custom"');
      }
      
      // For custom styles, we need to fetch the style and extract the base layer
      const response = await fetch(customStyleUrl);
      const customStyle = await response.json();
      
      // Find the first background or raster layer
      const baseLayer = customStyle.layers.find(layer => 
        layer.type === 'background' || layer.type === 'raster'
      );
      
      if (baseLayer && customStyle.sources[baseLayer.source]) {
        config = {
          source: customStyle.sources[baseLayer.source],
          layer: {
            ...baseLayer,
            paint: {
              ...baseLayer.paint,
              'raster-opacity': opacity
            }
          }
        };
      }
    }

    if (!config) {
      throw new Error(`Unknown base layer type: ${baseLayerType}`);
    }

    // Handle complete style replacement for base (nine3030Style)
    if (config.useCompleteStyle) {
      // Remove all existing layers and sources
      const existingLayers = currentStyle.layers;
      existingLayers.forEach(layer => {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
      });
      
      const existingSources = Object.keys(currentStyle.sources);
      existingSources.forEach(sourceId => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });

      // Use the complete nine3030Style with error handling
      try {
        // Add all sources from the nine3030Style
        Object.entries(config.style.sources).forEach(([sourceId, source]) => {
          try {
            map.addSource(sourceId, source);
          } catch (error) {
            console.warn(`Failed to add source ${sourceId}:`, error);
          }
        });

        // Add all layers from the nine3030Style
        config.style.layers.forEach(layer => {
          try {
            map.addLayer(layer);
          } catch (error) {
            console.warn(`Failed to add layer ${layer.id}:`, error);
          }
        });
      } catch (error) {
        console.error('Error applying nine3030Style:', error);
        // Fallback to OpenStreetMap if nine3030Style fails
        const fallbackSource = {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        };
        
        try {
          map.addSource('fallback-source', fallbackSource);
          map.addLayer({
            id: 'fallback-layer',
            type: 'raster',
            source: 'fallback-source'
          });
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }

      // If preserving overlays, add them back
      if (preserveOverlays) {
        const overlayLayers = currentStyle.layers.filter(layer => 
          layers[layer.id] || layer.id.indexOf('gl-draw-') > -1
        );
        
        console.log('setAdvancedBaseLayer: Preserving overlay layers:', overlayLayers.map(l => l.id));
        console.log('setAdvancedBaseLayer: Available layers in layers object:', Object.keys(layers));
        
        overlayLayers.forEach(layer => {
          console.log('setAdvancedBaseLayer: Checking if layer exists on map:', layer.id, !!map.getLayer(layer.id));
          if (!map.getLayer(layer.id)) {
            console.log('setAdvancedBaseLayer: Adding back overlay layer:', layer.id);
            map.addLayer(layer);
          }
        });
      }
    } else {
      // Handle single layer approach for other base layer types
      const baseLayerId = 'base-layer';
      const baseSourceId = 'base-source';

      // Remove existing base layer and source if they exist
      if (map.getLayer(baseLayerId)) {
        map.removeLayer(baseLayerId);
      }
      if (map.getSource(baseSourceId)) {
        map.removeSource(baseSourceId);
      }

      // Also remove any existing base layers from the current style
      const existingBaseLayers = currentStyle.layers.filter(layer => 
        layer.type === 'background' || 
        layer.type === 'raster' ||
        layer.id === 'base-layer' ||
        layer.id === 'luchtfoto-pdok' // Remove the old satellite layer if it exists
      );

      existingBaseLayers.forEach(layer => {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
        // Only remove source if it's not used by other layers
        if (map.getSource(layer.source)) {
          const layersUsingSource = currentStyle.layers.filter(l => l.source === layer.source);
          if (layersUsingSource.length <= 1) {
            map.removeSource(layer.source);
          }
        }
      });

      // Add new base layer source
      map.addSource(baseSourceId, config.source);
      
      // Add new base layer
      map.addLayer({
        id: baseLayerId,
        source: baseSourceId,
        ...config.layer
      }, map.getStyle().layers[0]?.id); // Insert at the beginning

      // If preserving overlays, ensure they're still visible
      if (preserveOverlays) {
        const overlayLayers = currentStyle.layers.filter(layer => 
          layers[layer.id] || layer.id.indexOf('gl-draw-') > -1
        );
        
        console.log('setAdvancedBaseLayer: Preserving overlay layers (single layer approach):', overlayLayers.map(l => l.id));
        
        overlayLayers.forEach(layer => {
          console.log('setAdvancedBaseLayer: Checking if layer exists on map (single layer):', layer.id, !!map.getLayer(layer.id));
          if (!map.getLayer(layer.id)) {
            console.log('setAdvancedBaseLayer: Adding back overlay layer (single layer):', layer.id);
            map.addLayer(layer);
          }
        });
      }
    }

  } catch (error) {
    console.error('Error setting advanced base layer:', error);
    throw error;
  }
};

/**
 * Get information about the current base layer.
 * 
 * @param {Object} map - The MapLibre map instance
 * @returns {Object|null} Base layer information or null if not found
 */
export const getCurrentBaseLayer = (map) => {
  if (!map || !map.isStyleLoaded()) return null;

  const currentStyle = map.getStyle();
  
  // Check if we're using the nine3030Style (base)
  const compositeSource = currentStyle.sources.composite;
  if (compositeSource && compositeSource.tiles && compositeSource.tiles[0] && 
      compositeSource.tiles[0].includes('mapbox.mapbox-streets-v8')) {
    return {
      id: 'nine3030-style',
      type: 'vector',
      source: 'composite',
      sourceInfo: compositeSource,
      styleType: 'base'
    };
  }

  // Check if we're using the base layer (satellite/terrain)
  const currentBaseLayer = currentStyle.layers.find(layer => layer.id === 'base-layer');
  if (currentBaseLayer && currentBaseLayer.source === 'base-source') {
    const baseSource = currentStyle.sources['base-source'];
    if (baseSource && baseSource.tiles && baseSource.tiles[0]) {
      if (baseSource.tiles[0].includes('pdok.nl') && baseSource.tiles[0].includes('luchtfotorgb')) {
        return {
          id: 'base-layer',
          type: 'raster',
          source: 'base-source',
          sourceInfo: baseSource,
          styleType: 'satellite'
        };
      } else if (baseSource.tiles[0].includes('openstreetmap.org')) {
        return {
          id: 'base-layer',
          type: 'raster',
          source: 'base-source',
          sourceInfo: baseSource,
          styleType: 'terrain'
        };
      }
    }
  }

  const baseLayer = currentStyle.layers.find(layer => 
    layer.type === 'background' || 
    layer.type === 'raster' ||
    layer.id === 'base-layer'
  );

  if (!baseLayer) return null;

  return {
    id: baseLayer.id,
    type: baseLayer.type,
    source: baseLayer.source,
    sourceInfo: currentStyle.sources[baseLayer.source]
  };
};

/**
 * Check if a specific base layer is currently active.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} baseLayerType - Type to check for
 * @returns {boolean} True if the specified base layer is active
 */
export const isBaseLayerActive = (map, baseLayerType) => {
  if (!map || !map.isStyleLoaded()) return false;

  const currentStyle = map.getStyle();
  
  // Special handling for base (uses nine3030Style)
  if (baseLayerType === 'base') {
    // Check if the composite source from nine3030Style is present
    const compositeSource = currentStyle.sources.composite;
    if (compositeSource && compositeSource.tiles && compositeSource.tiles[0]) {
      return compositeSource.tiles[0].includes('mapbox.mapbox-streets-v8');
    }
    return false;
  }

  // Special handling for satellite (uses PDOK luchtfoto)
  if (baseLayerType === 'satellite') {
    // Check if the satellite-layer is present and uses PDOK luchtfoto
    const satelliteLayer = currentStyle.layers.find(layer => layer.id === 'satellite-layer');
    if (satelliteLayer && satelliteLayer.source === 'satellite') {
      const satelliteSource = currentStyle.sources['satellite'];
      if (satelliteSource && satelliteSource.tiles && satelliteSource.tiles[0]) {
        return satelliteSource.tiles[0].includes('pdok.nl') && satelliteSource.tiles[0].includes('luchtfotorgb');
      }
    }
    return false;
  }

  // Special handling for hybrid (uses PDOK luchtfoto with vector overlays)
  if (baseLayerType === 'hybrid') {
    // Check if the satellite-layer is present and uses PDOK luchtfoto, and composite source exists
    const satelliteLayer = currentStyle.layers.find(layer => layer.id === 'satellite-layer');
    const compositeSource = currentStyle.sources['composite'];
    if (satelliteLayer && satelliteLayer.source === 'satellite' && compositeSource) {
      const satelliteSource = currentStyle.sources['satellite'];
      if (satelliteSource && satelliteSource.tiles && satelliteSource.tiles[0]) {
        return satelliteSource.tiles[0].includes('pdok.nl') && satelliteSource.tiles[0].includes('luchtfotorgb');
      }
    }
    return false;
  }

  // Special handling for terrain (uses OpenStreetMap)
  if (baseLayerType === 'terrain') {
    // Check if the base-layer is present and uses OpenStreetMap
    const baseLayer = currentStyle.layers.find(layer => layer.id === 'base-layer');
    if (baseLayer && baseLayer.source === 'base-source') {
      const baseSource = currentStyle.sources['base-source'];
      if (baseSource && baseSource.tiles && baseSource.tiles[0]) {
        return baseSource.tiles[0].includes('openstreetmap.org');
      }
    }
    return false;
  }

  const currentBaseLayer = getCurrentBaseLayer(map);
  if (!currentBaseLayer) return false;

  // Check based on source tiles URL patterns
  const sourceUrl = currentBaseLayer.sourceInfo?.tiles?.[0] || '';
  
  const patterns = {
    satellite: /pdok\.nl.*luchtfotorgb/,
    hybrid: /maptiler\.com.*hybrid/
  };

  return patterns[baseLayerType]?.test(sourceUrl) || false;
};

/**
 * Safely remove a layer and its source from the map.
 * Only removes the source if no other layers are using it.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} layerId - Layer ID to remove
 */
export const safeRemoveLayer = (map, layerId) => {
  if (!map || !map.isStyleLoaded()) return;

  try {
    const layer = map.getLayer(layerId);
    if (!layer) return;

    const sourceId = layer.source;
    
    // Remove the layer first
    map.removeLayer(layerId);
    
    // Check if any other layers are using this source
    const currentStyle = map.getStyle();
    const layersUsingSource = currentStyle.layers.filter(l => l.source === sourceId);
    
    // Only remove source if no other layers are using it
    if (layersUsingSource.length === 0 && map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (error) {
    console.warn(`Error removing layer ${layerId}:`, error);
  }
};

/**
 * Check if a source is being used by any layers.
 * 
 * @param {Object} map - The MapLibre map instance
 * @param {string} sourceId - Source ID to check
 * @returns {boolean} True if the source is being used
 */
export const isSourceInUse = (map, sourceId) => {
  if (!map || !map.isStyleLoaded()) return false;

  const currentStyle = map.getStyle();
  return currentStyle.layers.some(layer => layer.source === sourceId);
};

// Legacy function for backward compatibility
export const applyMapStyle = async (map, styleUrlOrObject) => {
  console.warn('applyMapStyle is deprecated. Use setBaseLayer instead.');
  return setBaseLayer(map, styleUrlOrObject);
};

// Function to preload map styles for faster switching
export const preloadMapStyles = async () => {
  const mapStyles = getMapStyles();
  
  for (const [name, style] of Object.entries(mapStyles)) {
    if (typeof style === 'string' && !styleCache.has(style)) {
      try {
        const response = await fetch(style);
        if (response.ok) {
          const styleJson = await response.json();
          styleCache.set(style, styleJson);
        }
      } catch (error) {
        console.warn(`Failed to preload style ${name}:`, error);
      }
    }
  }
}

// Function to clear style cache (useful for memory management)
export const clearStyleCache = () => {
  styleCache.clear();
}
