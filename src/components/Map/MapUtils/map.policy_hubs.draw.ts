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
        defaultMode: 'draw_polygon'
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

function updateArea(e, draw) {
    // const data = draw.getAll();
    // const answer = document.getElementById('calculated-area');
    // if (data.features.length > 0) {
    //     const area = turfArea(data);
    //     // Restrict the area to 2 decimal points.
    //     const rounded_area = Math.round(area * 100) / 100;
    //     answer.innerHTML = `<p><strong>${rounded_area}</strong></p><p>square meters</p>`;
    // } else {
    //     answer.innerHTML = '';
    //     if (e.type !== 'draw.delete')
    //         alert('Click the map to draw a polygon.');
    // }
}

export {
    initMapboxDraw,
    initEventHandlers,
    updateArea,
    enableDrawingPolygon,
}
