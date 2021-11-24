import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';
import {SelectLayer} from '../components/SelectLayer/SelectLayer.jsx';

import './Map.css';

function Map(props) {
  const [layers, setLayers] = useState([
    'vehicles-heatmap',
    'vehicles-point',
    'zones-geodata'
  ]);
  const [activeSource, setActiveSource] = useState('vehicles');
  
  return (
    <div className="flex flex-col">
      <SelectLayer
        setLayers={setLayers}
        setActiveSource={setActiveSource}
      />
      <div className="flex-1 bg-red-400">
        <MapComponent
          mapContainer={props.mapContainer}
          layers={layers}
          activeSource={activeSource}
        />
      </div>
  </div>);
  
  
}

export default Map;
