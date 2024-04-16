import MapboxDraw from "@mapbox/mapbox-gl-draw";

const initMapboxDraw = (map) => {
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

    return draw;
}

const initEventHandlers = (map, updateFunction: Function) => {
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

    const drawed = draw.getAll();
    drawed.features.map(x => {
      console.log('x', x)
    })

    console.log(`changeMode('direct_select'`, id)
    draw.changeMode('direct_select', {
        featureId: id
    });
}

export {
    initMapboxDraw,
    initEventHandlers,
    enableDrawingPolygon,
    selectDrawPolygon
}
