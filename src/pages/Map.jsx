import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';

import './Map.css';

function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(5.102406);
  const [lat] = useState(52.0729252);
  const [zoom] = useState(14);

  // Docs: https://maptiler.zendesk.com/hc/en-us/articles/4405444890897-Display-MapLibre-GL-JS-map-using-React-JS
  useEffect(() => {
    if (map.current) return; //stops map from intializing more than once
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=oYg5wHevXnoE2PBNr3iN',
      center: [lng, lat],
      zoom: zoom
    });
  });

  return <div className="Map">
    <div ref={mapContainer} className="map" />
  </div>
}

export default Map;

