import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';

function Map(props) {
  const [layers, setLayers] = useState([
    // 'vehicles-heatmap',
    // 'vehicles-point',
    'vehicles-heatmap-city-level',
  ]);
  const [sources, setSources] = useState([
    'vehicles'
  ]);

  return <div>
    Map type:
    <button onClick={() => {

    }}>
      Vehicles
    </button> | 
    <button>
      Heatmap
    </button><br />
    <MapComponent
      layers={layers}
    />
  </div>
}

export default Map;
