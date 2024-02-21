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

//   /*
//    * Create geojson for all empty hexes
//    */
//   // Create hexagon feature set
//   let hexagonsAsArray = [];
//   allHexes.forEach((x) => {
//     hexagonsAsArray[x] = 0;
//   });

//   /*
//    * Create geojson for all filled hexes
//    */
//   // Get selected h3 hexe(s) from state
//   const selectedH3Hexes = (filter.h3niveau && filter.h3niveau === 8) ? filter.h3hexes8 : filter.h3hexes7;

//   // Add data value to hexes
//   geometriesHbData.forEach((x: HexagonType) => {
//     hexagonsAsArray[x.cell] = x.number_of_trips;
//   });
//   // Transform the hexagons into a GeoJSON object
//   const geojson = geojson2h3.h3SetToFeatureCollection(
//     Object.keys(hexagonsAsArray),
//     hex => {
//       return {
//         value: hexagonsAsArray[hex],
//         selected: selectedH3Hexes.indexOf(hex) > -1 ? 1 : 0
//       }
//     }
//   );

//   // Create a geojson polygon for the outline border
//   const threshold = 0.75;
//   const geojsonForOuterBorder = geojson2h3.h3SetToFeature(
//     Object.keys(hexagonsAsArray).filter(hex => hexagonsAsArray[hex] > threshold)
//   );

  return {
    // geojson,
    // geojsonForOuterBorder
  }
}

const removeServiceAreaSources = (map: any) => {
    let key, source;
    
    key = 'service_areas';
    source = map.getSource(key);
    if(source) map.removeSource(key);
}

const removeServiceAreasFromMap = (map: any) => {
    let layer, key;
    let source;
    
    key = 'service_areas-layer-fill';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
    
    key = 'service_areas-layer-border';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
  
    removeServiceAreaSources(map);
}

async function renderPolygons_fill(map, geojson) {
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
    map.setPaintProperty(layerId, 'fill-color', '#8f3af8');

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
  geojson: any,
) => {
  let features = [];
//   // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = geojson;

  // Remove old sources first
  removeServiceAreasFromMap(map);
  // Render hexes
  renderPolygons_fill(map, featureCollection);
//   // Render outline border
//   renderPolygons_border(map, featureCollection.geojsonForOuterBorder, filter);
//   // Render percentages inside the polygons
//   renderPercentageValues(map, featureCollection.geojson, filter);
}

export {
    renderServiceAreas
}
