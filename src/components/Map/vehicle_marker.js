// The original SVG that is used to make the programatic one
// const initialMarker2 = `
// <div id="test">
//     <circle id="Ellipse_129" data-name="Ellipse 129" cx="12" cy="12" r="12" fill="#1fa024" opacity="0.304"></circle>
//     <g id="Ellipse_130" data-name="Ellipse 130" transform="translate(2 2)" fill="#1fa024" stroke="#fff" stroke-width="1">
//         <circle cx="10" cy="10" r="10" stroke="none"></circle>
//         <circle cx="10" cy="10" r="9.5" fill="none"></circle>
//     </g>
//     <circle id="Ellipse_192" data-name="Ellipse 192" cx="4.5" cy="4.5" r="4.5" transform="translate(14 1)" fill="#1f3ff0"></circle>
// </div>
//     `;

async function getVehicleMarkers(operatorColor) {
    var gradients = ['#1FA024', '#48E248', '#FFD837', '#FD3E48', '#9158DE'];
    var markers = [];
    for (const durationIndicationColor of gradients) {
        var marker = await styleVehicleMarker(operatorColor, durationIndicationColor);
        markers.push(marker);
    }
    return markers;
}

async function getVehicleMarkers_rentals(operatorColor) {
    var gradients = ['#48E248', '#44BD48', '#3B7747', '#343E47'];
    var markers = [];
    for (const distanceIndicationColor of gradients) {
        var marker = await styleVehicleMarker(operatorColor, distanceIndicationColor);
        markers.push(marker);
    }
    return markers;
}

async function styleVehicleMarker(operatorColor, durationIndicationColor) {
    var xmlns = "http://www.w3.org/2000/svg";
    var svgElement = document.createElementNS(xmlns, "svg");
    
    // outer transparant circle
    var circle_1 = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    circle_1.setAttribute("cx","12");
    circle_1.setAttribute("cy","12");
    circle_1.setAttribute("r","12");
    circle_1.setAttribute("fill","12");
    circle_1.setAttribute("opacity","0.304");
    circle_1.setAttribute("fill", durationIndicationColor);
    svgElement.appendChild(circle_1);

    // inner non transparant circle
    var inner_circle = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    inner_circle.setAttribute("transform","translate(2 2)");
    inner_circle.setAttribute("fill",durationIndicationColor);
    inner_circle.setAttribute("stroke","#fff");
    inner_circle.setAttribute("stroke-width","1");

    var child_circle_1 = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    child_circle_1.setAttribute("cx","10");
    child_circle_1.setAttribute("cy","10");
    child_circle_1.setAttribute("r","10");
    child_circle_1.setAttribute("stroke","none");

    var  child_circle_2 = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    child_circle_2.setAttribute("cx","10");
    child_circle_2.setAttribute("cy","10");
    child_circle_2.setAttribute("r","9.5");
    child_circle_2.setAttribute("fill","none");
    inner_circle.appendChild(child_circle_1);
    inner_circle.appendChild(child_circle_2);
    svgElement.appendChild(inner_circle);

    // indicator right top
    var small_circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    small_circle.setAttribute("cx","4.5");
    small_circle.setAttribute("cy","4.5");
    small_circle.setAttribute("r","4.5");
    small_circle.setAttribute("transform","translate(14 1)");
    small_circle.setAttribute("fill", operatorColor);
    svgElement.appendChild(small_circle);

    var width = {};
    var height = {};
 
    // console.log(svg.firstChild.tagName);
    svgElement.setAttribute("viewBox", "0 0 24 24");

    width.value = 50;
    height.value = 50;
    
    var canvas = document.createElement('canvas');
    svgElement.setAttribute('width', width.value);
    svgElement.setAttribute('height', height.value);
    canvas.width = width.value;
    canvas.height = height.value;
    var data = new XMLSerializer().serializeToString(svgElement);
    var win = window.URL || window.webkitURL || window;
    var img = new Image();
    var blob = new Blob([data], { type: 'image/svg+xml' });

    var url = win.createObjectURL(blob);
    img.src = url;
    await img.decode();
    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    win.revokeObjectURL(url);
 
    return new Uint8Array(context.getImageData(0, 0, img.width, img.height).data.buffer);
}

export {
    getVehicleMarkers,
    getVehicleMarkers_rentals
}
