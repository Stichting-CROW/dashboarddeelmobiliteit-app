
const removeSources = (map: any) => {
    if(! map) return;

    let key, source;
    
    key = 'service_area_delta';
    source = map.getSource(key);
    if(source) map.removeSource(key);
}

const removeServiceAreaDeltaFromMap = (map: any) => {
    if(! map) return;

    let layer, key;
    let source;
    
    key = 'service_area_delta-layer-fill';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
    
    key = 'service_area_delta-layer-border';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
  
    removeSources(map);
}

async function renderPolygons_fill(map, geojson) {
  if(! map) return;
  if(! geojson) return;

  const sourceId = 'service_area_delta';
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
  map.setPaintProperty(
    layerId,
    'fill-color',
    ['match', ['get', 'type'],
      'unchanged', '#666',
      'removed', '#f00',
      'added', '#0f0',
      '#8f3af8'
    ]
  );

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

const createFeatureCollection = (data) => {
  const newFeatures = [];
  if(data.unchanched_geometries && data.unchanched_geometries.features)
    data.unchanched_geometries.features.forEach((x) => {
      x.properties.type = 'unchanged';
      newFeatures.push(x);
    });
  if(data.added_geometries && data.added_geometries.features)
    data.added_geometries.features.forEach((x) => {
      x.properties.type = 'added';
      newFeatures.push(x);
    });
  if(data.removed_geometries && data.removed_geometries.features)
    data.removed_geometries.features.forEach((x) => {
      x.properties.type = 'removed';
      newFeatures.push(x);
    });

  // Create a proper GeoJSON FeatureCollection
  const geojson = {
    type: 'FeatureCollection',
    features: newFeatures
  };
  return geojson;
}

const renderServiceAreaDelta = async (
  map: any,
  serviceAreaVersionData: any,
) => {
  // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = createFeatureCollection(serviceAreaVersionData);

  // Remove old sources first
  removeServiceAreaDeltaFromMap(map);

  // Render hexes
  renderPolygons_fill(map, featureCollection);
}

export {
    renderServiceAreaDelta,
    removeServiceAreaDeltaFromMap
}
