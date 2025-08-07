import { getProviderColorForProvider } from "../../../helpers/providers";

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

const removeServiceAreaSources = (map: any) => {
    if(! map) return;

    let key, source;
    
    key = 'service_areas';
    source = map.getSource(key);
    if(source) map.removeSource(key);
}

const removeServiceAreasFromMap = (map: any) => {
    if(! map) return;

    let layer, key;
    
    key = 'service_areas-layer-fill';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
    
    key = 'service_areas-layer-border';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
  
    removeServiceAreaSources(map);
}

async function renderPolygons_fill(map, operator: string, geojson) {
    const sourceId = 'service_areas';
    let layerId = `${sourceId}-layer-fill`
      , source = map.getSource(sourceId);
    const layer = map.getLayer(layerId)
  
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
    if (! layer) {
      // Add hexes (fill + 1px outline)
      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'fill'
      });
    }
    // If source was already present: Update data
    else {
      // Update the geojson data
      source.setData(geojson);
    }
    
    // Set fill color
    // map.setPaintProperty(layerId, 'fill-color', '#8f3af8');
    map.setPaintProperty(layerId, 'fill-color', getProviderColorForProvider(operator));

    // Set opacity
    map.setPaintProperty(layerId, 'fill-opacity', 0.6);
  
    // Add line layer for wider outline/borders, on top of fill layer
    // Info here: https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness/50372832#50372832
    layerId = `${sourceId}-layer-border`;
    map.addLayer({
      id: layerId,
      source: sourceId,
      type: 'line',
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
    });
}

const renderServiceAreas = async (
  map: any,
  operator: string,
  geojson: any,
) => {
  let features = [];
//   // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = geojson;

  // Remove old sources first
  removeServiceAreasFromMap(map);
  // Render hexes
  renderPolygons_fill(map, operator, featureCollection);
//   // Render outline border
//   renderPolygons_border(map, featureCollection.geojsonForOuterBorder, filter);
//   // Render percentages inside the polygons
//   renderPercentageValues(map, featureCollection.geojson, filter);
}

export {
    renderServiceAreas,
    removeServiceAreasFromMap
}
