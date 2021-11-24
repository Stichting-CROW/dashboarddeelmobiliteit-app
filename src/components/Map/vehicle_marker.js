const initialMarker = `<svg id="Pointer_Green_met_Aanbieder" data-name="Pointer Green met Aanbieder" xmlns="http://www.w3.org/2000/svg" width="200" height=200" viewBox="0 0 24 24">
    <circle id="Ellipse_129" data-name="Ellipse 129" cx="12" cy="12" r="12" fill="#1fa024" opacity="0.304"/>
    <g id="Ellipse_130" data-name="Ellipse 130" transform="translate(2 2)" fill="#1fa024" stroke="#fff" stroke-width="1">
        <circle cx="10" cy="10" r="10" stroke="none"/>
        <circle cx="10" cy="10" r="9.5" fill="none"/>
    </g>
    <circle id="Ellipse_192" data-name="Ellipse 192" cx="4.5" cy="4.5" r="4.5" transform="translate(14 1)" fill="#1f3ff0"/>
</svg>
`;

const testMarker = `
<svg id="Pointer_Green_met_Aanbieder" data-name="Pointer Green met Aanbieder" xmlns="http://www.w3.org/2000/svg" width="200" height="932" viewBox="0 0 24 24">
        <circle id="Ellipse_129" data-name="Ellipse 129" cx="12" cy="12" r="12" fill="#1fa024" opacity="0.304"/>
            <g id="Ellipse_130" data-name="Ellipse 130" transform="translate(2 2)" fill="#1fa024" stroke="#fff" stroke-width="1">
                <circle cx="10" cy="10" r="10" stroke="none"/>
                <circle cx="10" cy="10" r="9.5" fill="none"/>
            </g>
        <circle id="Ellipse_192" data-name="Ellipse 192" cx="4.5" cy="4.5" r="4.5" transform="translate(14 1)" fill="#44ff33"/>
        </svg>`;

const testMarker2 = `
<svg id="Pointer_Green_met_Aanbieder" data-name="Pointer Green met Aanbieder" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200">
    <circle id="Ellipse_129" data-name="Ellipse 129" cx="12" cy="12" r="12" fill="#1fa024" opacity="0.304"/>
    <g id="Ellipse_130" data-name="Ellipse 130" transform="translate(2 2)" fill="#1fa024" stroke="#fff" stroke-width="1">
        <circle cx="10" cy="10" r="10" stroke="none"/>
        <circle cx="10" cy="10" r="9.5" fill="none"/>
    </g>
    <circle id="Ellipse_192" data-name="Ellipse 192" cx="4.5" cy="4.5" r="4.5" transform="translate(14 1)" fill="#1f3ff0"/>
</svg>`;

const compare = `<svg xmlns="http://www.w3.org/1999/xhtml" viewbox="0 0 24 24" width="200" height="200">
<circle id="Ellipse_129" data-name="Ellipse 129" cx="12" cy="12" r="12" fill="#1fa024" opacity="0.304">
<g id="Ellipse_130" data-name="Ellipse 130" transform="translate(2 2)" fill="#1fa024" stroke="#fff" stroke-width="1">
    <circle cx="10" cy="10" r="10" stroke="none">
    <circle cx="10" cy="10" r="9.5" fill="none">
</circle></circle></g>
<circle id="Ellipse_192" data-name="Ellipse 192" cx="4.5" cy="4.5" r="4.5" transform="translate(14 1)" fill="#1f3ff0">
</circle></circle></svg>

`

const initialMarker2 = `
    <circle id="Ellipse_129" data-name="Ellipse 129" cx="12" cy="12" r="12" fill="#1fa024" opacity="0.304"></circle>
    <g id="Ellipse_130" data-name="Ellipse 130" transform="translate(2 2)" fill="#1fa024" stroke="#fff" stroke-width="1">
        <circle cx="10" cy="10" r="10" stroke="none"></circle>
        <circle cx="10" cy="10" r="9.5" fill="none"></circle>
    </g>
    <circle id="Ellipse_192" data-name="Ellipse 192" cx="4.5" cy="4.5" r="4.5" transform="translate(14 1)" fill="#1f3ff0"></circle>
`;

async function getVehicleMarkers(operatorColor) {
    var gradients = ['#000000'];
    var markers = [];
    for (const durationIndicationColor of gradients) {
        var marker = await styleVehicleMarker(operatorColor,  durationIndicationColor);
        markers.push(marker);
    }   
    return markers;
}

async function styleVehicleMarker(operatorColor, durationIndicationColor) {
    var xmlns = "http://www.w3.org/2000/svg";
    var svgElement = document.createElementNS(xmlns, "svg");
    svgElement.innerHTML = initialMarker2;
    var svg = svgElement;
    var width = {};
    var height = {};
    // var test = svg.getElementById("Ellipse_192");
    // test.setAttribute("fill", "#44ff33");
    // console.log(svg.firstChild.tagName);
    svg.setAttribute("viewBox", "0 0 24 24");
    
    console.log(svg);
    // svg = svg.querySelector('svg');
    width.value = 25;
    height.value = 25;
    
    var canvas = document.createElement('canvas');
    svg.setAttribute('width', width.value);
    svg.setAttribute('height', height.value);
    canvas.width = width.value;
    canvas.height = height.value;
    var data = new XMLSerializer().serializeToString(svg);
    var win = window.URL || window.webkitURL || window;
    var img = new Image();
    var blob = new Blob([data], { type: 'image/svg+xml' });

    var url = win.createObjectURL(blob);
    img.src = url;
    await img.decode();
    console.log("test2");
    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    win.revokeObjectURL(url);
 
    return new Uint8Array(context.getImageData(0, 0, img.width, img.height).data.buffer);
}

export default getVehicleMarkers;


    