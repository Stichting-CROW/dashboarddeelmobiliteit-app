import MapboxDraw from "@mapbox/mapbox-gl-draw";

// Track the active draw control at module level so we can always clean it up,
// even if React state/refs get out of sync during mount/unmount cycles.
let activeDrawControl: any = null;

const DRAW_SOURCE_IDS = ['mapbox-gl-draw-cold', 'mapbox-gl-draw-hot'];

const removeDrawSources = (map) => {
  if (!map) return;
  DRAW_SOURCE_IDS.forEach(sourceId => {
    try {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } catch {
      // Source may already be removed or map may be destroyed.
    }
  });
};

const initMapboxDraw = (map) => {
    // Clean up any previous control first to avoid duplicate sources.
    if (activeDrawControl) {
      removeDrawControl(map, activeDrawControl);
    }
    // Defensive cleanup of draw sources in case the control reference was lost.
    removeDrawSources(map);

    const draw = new MapboxDraw({
        displayControlsDefault: false,
        // Select which mapbox-gl-draw control buttons to add to the map.
        controls: {
            // polygon: true,
            // trash: true
        },
        // Set mapbox-gl-draw to draw by default.
        // The user does not have to click the polygon control button first.
        defaultMode: 'simple_select'
    });
    map.addControl(draw);
    activeDrawControl = draw;

    return draw;
}

const initEventHandlers = (map, updateFunction: Function) => {
  // Remove existing handlers first
  map.off('draw.create', updateFunction);
  map.off('draw.delete', updateFunction);
  map.off('draw.update', updateFunction);
  
  // Add new handlers
  map.on('draw.create', updateFunction);
  map.on('draw.delete', updateFunction);
  map.on('draw.update', updateFunction);
}

const enableDrawingPolygon = (draw) => {
    if(! draw) return;

    draw.changeMode('draw_polygon');
}

const selectDrawPolygon = (draw, id) => {
    if(! draw) return;
    // if(! id) return;

    // const drawed = draw.getAll();
    // drawed.features.map(x => {
    //   console.log('x', x)
    // })

    draw.changeMode('direct_select', {
      featureId: id
    });
}

const removeDrawedPolygons = (draw) => {
    // Remove all drawed zones from the map
    if(! draw) return;
    try {
      draw.deleteAll();
      draw.changeMode('simple_select');
    } catch {
      // Draw control may already have been removed from the map.
    }
}

const removeDrawControl = (map, draw) => {
    if(! map || ! draw) return;
    try {
      removeDrawedPolygons(draw);
      map.removeControl(draw);
    } catch {
      // Control may already have been removed or map may be destroyed.
    }
    if (activeDrawControl === draw) {
      activeDrawControl = null;
    }
}

export {
    initMapboxDraw,
    initEventHandlers,
    enableDrawingPolygon,
    selectDrawPolygon,
    removeDrawedPolygons,
    removeDrawControl
}
