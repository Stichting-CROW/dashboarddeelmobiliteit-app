
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

type LegendItemType = 'added' | 'unchanged' | 'removed';

async function renderPolygons_fill(map, geojson, activeTypes?: Set<LegendItemType>) {
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
  
  // Set filter based on active types
  if (activeTypes && activeTypes.size > 0) {
    // Build filter expression using 'any' with multiple '==' conditions
    const activeTypesArray = Array.from(activeTypes);
    if (activeTypesArray.length === 1) {
      // Single condition
      map.setFilter(layerId, ['==', ['get', 'type'], activeTypesArray[0]]);
    } else {
      // Multiple conditions using 'any'
      const conditions = activeTypesArray.map(type => ['==', ['get', 'type'], type]);
      map.setFilter(layerId, ['any', ...conditions]);
    }
  } else {
    // If no active types, hide all
    map.setFilter(layerId, ['literal', false]);
  }
  
  // Set fill color
  map.setPaintProperty(
    layerId,
    'fill-color',
    ['match', ['get', 'type'],
      'unchanged', '#c06427',
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
  const borderLayer = map.getLayer(layerId);
  if (!borderLayer) {
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
  
  // Apply same filter to border layer (always update filter, even if layer already exists)
  if (activeTypes && activeTypes.size > 0) {
    const activeTypesArray = Array.from(activeTypes);
    if (activeTypesArray.length === 1) {
      map.setFilter(layerId, ['==', ['get', 'type'], activeTypesArray[0]]);
    } else {
      const conditions = activeTypesArray.map(type => ['==', ['get', 'type'], type]);
      map.setFilter(layerId, ['any', ...conditions]);
    }
  } else {
    map.setFilter(layerId, ['literal', false]);
  }
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

const updateLayerFilters = (map: any, activeTypes?: Set<LegendItemType>) => {
  if (!map) return;
  
  const sourceId = 'service_area_delta';
  const fillLayerId = `${sourceId}-layer-fill`;
  const borderLayerId = `${sourceId}-layer-border`;
  
  const fillLayer = map.getLayer(fillLayerId);
  const borderLayer = map.getLayer(borderLayerId);
  
  if (!fillLayer || !borderLayer) return;
  
  const buildFilter = (types: Set<LegendItemType>) => {
    if (!types || types.size === 0) {
      return ['literal', false];
    }
    const activeTypesArray = Array.from(types);
    if (activeTypesArray.length === 1) {
      return ['==', ['get', 'type'], activeTypesArray[0]];
    } else {
      const conditions = activeTypesArray.map(type => ['==', ['get', 'type'], type]);
      return ['any', ...conditions];
    }
  };
  
  const filter = buildFilter(activeTypes);
  map.setFilter(fillLayerId, filter);
  map.setFilter(borderLayerId, filter);
};

const renderServiceAreaDelta = async (
  map: any,
  serviceAreaVersionData: any,
  activeTypes?: Set<LegendItemType>
) => {
  // Create feature collection based on geometriesForUser & hbDataResponse
  const featureCollection = createFeatureCollection(serviceAreaVersionData);

  // Remove old sources first
  removeServiceAreaDeltaFromMap(map);

  // Render hexes
  renderPolygons_fill(map, featureCollection, activeTypes);
}

export {
    renderServiceAreaDelta,
    removeServiceAreaDeltaFromMap,
    updateLayerFilters
}
