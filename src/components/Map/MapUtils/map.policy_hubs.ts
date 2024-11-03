import {
  polygonLineStyle,
  polygonFillStyle
} from './map.policy_hubs.styles'

const max_zoom_for_hub_logo = 16;

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
  
    key = 'policy_hubs-hub-logo';
    layer = map.getLayer(`${key}`);
    if(layer) map.removeLayer(`${key}`);

    // Remove event listeners
    map.off('click', key, clickHubLogo);

    removeHubSources(map);
}

const clickHubLogo = (e) => {
  const zoom = window['ddMap'].getZoom();

  window['ddMap'].easeTo({
    center: e.lngLat,
    zoom: zoom+2
  });
}

async function renderPolygons_fill(map, geojson) {
    if(! map) return;
    if(! map.isStyleLoaded()) return;
    
    const sourceId = 'policy_hubs';
    let layerId = `${sourceId}-layer-fill`
      , source = map.getSource(sourceId);
    const layer = map.getLayer(layerId)
  
    // Add the source if we haven't created them yet
    if (! source) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        // tolerance: 0.5,// Simplies polygons for performance. Defaults to 0.375. Higher is simpler.
        tolerance: 0.2,// Simplies polygons for performance. Defaults to 0.375. Higher is simpler.
        generateId: true, // This ensures that all features have unique IDs
      });
  
      // Set source variable
      source = map.getSource(sourceId);
    }
    // Add layers if these weren't added yet
    if (! layer) {
      // Add polygons (fill + 1px outline) if zoomed in
      map.addLayer({
        id: `${layerId}`,
        source: sourceId,
        type: 'fill',
        paint: polygonFillStyle,
        // Only show hubs fill from a certain zoom level
        // Inspired by: https://stackoverflow.com/a/74550432
        "filter": [
          ">=", ["zoom"],
            ["match", ["get", "geography_type"],
            'no_parking', 0,// 0 = minimum zoom level / always show monitoring zones
            'monitoring', 0,// 0 = minimum zoom level / always show monitoring zones
            max_zoom_for_hub_logo]
        ]
      });

      // Add line layer for wider outline/borders, on top of fill layer
      // Info here: https://stackoverflow.com/questions/50351902/in-a-mapbox-gl-js-layer-of-type-fill-can-we-control-the-stroke-thickness/50372832#50372832
      layerId = `${sourceId}-layer-border`;
      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'line',
        paint: polygonLineStyle,
        // Only show hubs outlines from a certain zoom level
        "filter": [
          ">=", ["zoom"],
            ["match", ["get", "geography_type"],
            'no_parking', 0,// 0 = minimum zoom level / always show monitoring zones
            'monitoring', 0,// 0 = minimum zoom level / always show monitoring zones
            max_zoom_for_hub_logo]
        ]
      });

      layerId = `${sourceId}-hub-logo`;
      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'symbol',
        'layout': {
          'icon-image': 'hub-icon-mijksenaar',
          "icon-size": [
            'interpolate',
            // Set the exponential rate of change to 1.5
            ['exponential', 1.5],
            ['zoom'],
            // When zoom is 1, icon will be 50% size.
            1,
            0.005,
            // 
            11,
            0.02,
            // When zoom is 10, icon will be 50% size.
            12,
            0.04,
            //
            13,
            0.06,
            // When zoom is 22, icon will be 10% size.
            15,
            0.15
          ],
          'icon-allow-overlap': true,
        },
        // Only show hub logo until a certain zoom level
        // Inspired by: https://stackoverflow.com/a/74550432
        "filter": [
          "<", ["zoom"],
            ["match", ["get", "geography_type"],
            'no_parking', 0,// 0 = maximum zoom level (never show mijksenaar logo for no_parking zones)
            'monitoring', 0,// 0 = maximum zoom level (never show mijksenaar logo for monitoring zones)
            max_zoom_for_hub_logo]
        ]
      });

      map.on('click', layerId, clickHubLogo);
      map.on('mouseenter', layerId, function () {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, function () {
        map.getCanvas().style.cursor = '';
      });

    }
    // If source was already present: Update data
    else {
      // Update the geojson data
      source.setData(geojson);
    }
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
                "geography_type": x.geography_type,
                "phase": x.phase,
                "stop": x.stop,
                "created_at": x.created_at,
                "is_selected": selected_policy_hubs && selected_policy_hubs.indexOf(x.zone_id) > -1 ? 1 : 0,
                "is_in_drawing_mode": hubs_in_drawing_mode && hubs_in_drawing_mode.indexOf(x.zone_id) > -1 ? 1 : 0
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
