
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
    if(! map) return;
    
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
      // Add polygons (fill + 1px outline)
      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'fill',
        paint: {
          'fill-opacity': [
            'case',
              ['==', ['get', 'is_in_drawing_mode'], 1], 0,
              0.6
          ]
        }
      });
    }
    // If source was already present: Update data
    else {
      // Update the geojson data
      source.setData(geojson);
    }
    
    // Set fill color
    map.setPaintProperty(layerId, 'fill-color', '#FD862E');

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
          ["==", ["get", "is_selected"], 1], '#ff0',
          ["boolean", ["feature-state", "hover"], false], '#666',
          '#DDD'
        ],
        'line-width': [
          "case",
          ["==", ["get", "is_selected"], 1], 3,
          ["boolean", ["feature-state", "hover"], false], 2,
          1
        ],
        'line-opacity': [
          'case',
          ['==', ['get', 'is_in_drawing_mode'], 1], 0,
          1
        ]
        // 'line-opacity': [
        //   "case",
        //     ["all",
        //       ["==", ["get", "is_selected"], 1],
        //       ["==", ["get", "phase"], 'concept'],
        //     ], 0,
        //     1
        // ]
      }
    });
}

const generateGeojson = (
  hubs,
  selected_policy_hubs,
  hubs_in_drawing_mode
) => {
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
                "created_at": x.created_at,
                "is_selected": selected_policy_hubs.indexOf(x.zone_id) > -1 ? 1 : 0,
                "is_in_drawing_mode": hubs_in_drawing_mode.indexOf(x.zone_id) > -1 ? 1 : 0
            },
            "geometry": x.area.geometry
        }
        geoJson.features.push(feature);
    });

    return geoJson;   
}

const renderHubs = async (
  map: any,
  hubs: any,
  selected_policy_hubs: any,
  hubs_in_drawing_mode: any
) => {
  if(! map) return;

  // Generate feature collection from hubs
  const featureCollection = generateGeojson(
    hubs,
    selected_policy_hubs,
    hubs_in_drawing_mode
  );

  // Remove old polygons first
  removeHubsFromMap(map);

  // Render polygons
  renderPolygons_fill(map, featureCollection);
}

export {
    renderHubs,
    removeHubsFromMap
}
