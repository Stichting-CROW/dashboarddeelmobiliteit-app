const MARKER_SIZE = 50;
const markerRasterCache = new Map();

function markerCacheKey(operatorColor, durationIndicationColor, isNonOperational) {
  return `${operatorColor || '#666'}|${durationIndicationColor}|${isNonOperational ? 1 : 0}`;
}

async function getVehicleMarkers(operatorColor, isNonOperational = false) {
  const gradients = ['#1FA024', '#48E248', '#FFD837', '#FD3E48', '#9158DE'];
  return Promise.all(
    gradients.map((durationIndicationColor) =>
      styleVehicleMarker(operatorColor, durationIndicationColor, isNonOperational)
    )
  );
}

async function getVehicleMarkers_rentals(operatorColor) {
  const gradients = ['#48E248', '#44BD48', '#3B7747', '#343E47'];
  return Promise.all(
    gradients.map((distanceIndicationColor) =>
      styleVehicleMarker(operatorColor, distanceIndicationColor, false)
    )
  );
}

async function styleVehicleMarker(operatorColor, durationIndicationColor, isNonOperational = false) {
  const cacheKey = markerCacheKey(operatorColor, durationIndicationColor, isNonOperational);
  const cached = markerRasterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const rasterPromise = rasterizeVehicleMarkerSvg(
    operatorColor,
    durationIndicationColor,
    isNonOperational
  );
  markerRasterCache.set(cacheKey, rasterPromise);

  try {
    return await rasterPromise;
  } catch (error) {
    markerRasterCache.delete(cacheKey);
    throw error;
  }
}

async function rasterizeVehicleMarkerSvg(operatorColor, durationIndicationColor, isNonOperational) {
  const xmlns = 'http://www.w3.org/2000/svg';
  const svgElement = document.createElementNS(xmlns, 'svg');
  const resolvedOperatorColor = operatorColor || '#666';

  const circle1 = document.createElementNS(xmlns, 'circle');
  circle1.setAttribute('cx', '12');
  circle1.setAttribute('cy', '12');
  circle1.setAttribute('r', '12');
  circle1.setAttribute('opacity', '0.304');
  circle1.setAttribute('fill', durationIndicationColor);
  svgElement.appendChild(circle1);

  const innerCircle = document.createElementNS(xmlns, 'g');
  innerCircle.setAttribute('transform', 'translate(2 2)');
  innerCircle.setAttribute('fill', durationIndicationColor);
  innerCircle.setAttribute('stroke', '#fff');
  innerCircle.setAttribute('stroke-width', '1');

  const childCircle1 = document.createElementNS(xmlns, 'circle');
  childCircle1.setAttribute('cx', '10');
  childCircle1.setAttribute('cy', '10');
  childCircle1.setAttribute('r', '10');
  childCircle1.setAttribute('stroke', 'none');

  const childCircle2 = document.createElementNS(xmlns, 'circle');
  childCircle2.setAttribute('cx', '10');
  childCircle2.setAttribute('cy', '10');
  childCircle2.setAttribute('r', '9.5');
  childCircle2.setAttribute('fill', 'none');
  innerCircle.appendChild(childCircle1);
  innerCircle.appendChild(childCircle2);
  svgElement.appendChild(innerCircle);

  if (isNonOperational) {
    const triangle = document.createElementNS(xmlns, 'polygon');
    triangle.setAttribute('points', '0,9 9,9 4.5,0');
    triangle.setAttribute('transform', 'translate(14 1)');
    triangle.setAttribute('fill', resolvedOperatorColor);
    svgElement.appendChild(triangle);

    const exclamationStem = document.createElementNS(xmlns, 'rect');
    exclamationStem.setAttribute('x', '4.1');
    exclamationStem.setAttribute('y', '2.2');
    exclamationStem.setAttribute('width', '0.8');
    exclamationStem.setAttribute('height', '3.5');
    exclamationStem.setAttribute('rx', '0.3');
    exclamationStem.setAttribute('transform', 'translate(14 1)');
    exclamationStem.setAttribute('fill', '#FFFFFF');
    svgElement.appendChild(exclamationStem);

    const exclamationDot = document.createElementNS(xmlns, 'circle');
    exclamationDot.setAttribute('cx', '4.5');
    exclamationDot.setAttribute('cy', '6.9');
    exclamationDot.setAttribute('r', '0.55');
    exclamationDot.setAttribute('transform', 'translate(14 1)');
    exclamationDot.setAttribute('fill', '#FFFFFF');
    svgElement.appendChild(exclamationDot);
  } else {
    const smallCircle = document.createElementNS(xmlns, 'circle');
    smallCircle.setAttribute('cx', '4.5');
    smallCircle.setAttribute('cy', '4.5');
    smallCircle.setAttribute('r', '4.5');
    smallCircle.setAttribute('transform', 'translate(14 1)');
    smallCircle.setAttribute('fill', resolvedOperatorColor);
    svgElement.appendChild(smallCircle);
  }

  svgElement.setAttribute('viewBox', '0 0 24 24');
  svgElement.setAttribute('width', String(MARKER_SIZE));
  svgElement.setAttribute('height', String(MARKER_SIZE));

  const canvas = document.createElement('canvas');
  canvas.width = MARKER_SIZE;
  canvas.height = MARKER_SIZE;

  const svgMarkup = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  await img.decode();

  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);

  return new Uint8Array(context.getImageData(0, 0, MARKER_SIZE, MARKER_SIZE).data.buffer);
}

export {
  getVehicleMarkers,
  getVehicleMarkers_rentals
};
