
const removeHubSources = (map: any) => {
    if(! map) return;

    let key, source;
    
    key = 'policy_hubs';
    source = map.getSource(key);
    if(source) map.removeSource(key);
}

const removeHubsFromMap = (map: any) => {
    if(! map) return;

    let layer, key;
    
    key = 'policy_hubs-layer-fill';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
    
    key = 'policy_hubs-layer-border';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);
  
    removeHubSources(map);
}

async function renderPolygons_fill(map, geojson) {
    const sourceId = 'policy_hubs';
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
    map.setPaintProperty(layerId, 'fill-color', '#666');

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

const generateGeojson = (hubs) => {
    let geoJson = {
        type: "FeatureCollection",
        features: []
    }
    
    if(! hubs || ! hubs[0]) {
        return geoJson;
    }
    hubs.forEach(x => {
        let feature = {
            "type":"Feature",
            "properties":{
                "id": x.zone_id,
                "name": x.name,
                "phase": x.phase,
                "created_at": x.created_at
            },
            "geometry": x.area.geometry
        }
        geoJson.features.push(feature);
    });

    return geoJson;   
}

const renderHubs = async (
  map: any,
  hubs: any
) => {
  // Generate feature collection from hubs
  const featureCollection = generateGeojson(hubs);

  // Remove old polygons first
  removeHubsFromMap(map);

  // Render polygons
  renderPolygons_fill(map, featureCollection);
}

export {
    renderHubs,
    removeHubsFromMap
}
