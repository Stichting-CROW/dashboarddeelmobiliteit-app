import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';

function Map(props) {
  const [layers, setLayers] = useState([
    'vehicles-heatmap',
    'vehicles-point'
  ]);
  const [sources, setSources] = useState([
    'vehicles'
  ]);

  return <div>
    Map type:
    <button onClick={() => {
      setLayers([
        'vehicles-heatmap',
        'vehicles-point',
      ])
    }}>
      Vehicles
    </button> | 
    <button onClick={() => {
      setLayers([
        'vehicles-heatmap-city-level'
      ])
    }}>
      Heatmap
    </button><br />
    <MapComponent
      layers={layers}
    />
  </div>
}

export default Map;
