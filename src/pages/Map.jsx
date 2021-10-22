import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';

function Map(props) {
  const [layers, setLayers] = useState([
    'vehicles-heatmap',
    'vehicles-point'
  ]);
  const [sources, setSources] = useState([]);

  return <div>
    Map type:
    <button onClick={() => {

    }}>
      Default
    </button>
    <button>
      Heatmap
    </button>
    <MapComponent layers={layers} />
  </div>
}

export default Map;
