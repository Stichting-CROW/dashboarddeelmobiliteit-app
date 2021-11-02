import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';

function Map(props) {
  const [layers, setLayers] = useState([
    'vehicles-heatmap',
    'vehicles-point',
    'zones-geodata'
  ]);
  // const [sources, setSources] = useState([
  //   'vehicles'
  // ]);
  
  return (
    <div className="flex flex-col">
      <div className="flex-none">
        Map type:
        <button onClick={() => {
          setLayers([
            'vehicles-heatmap',
            'vehicles-point',
            'zones-geodata',
          ])
        }}>
          Vehicles
        </button> |
        <button className="" onClick={() => {
          setLayers([
            'vehicles-heatmap-city-level',
            'zones-geodata',
          ])
        }}>
          Heatmap
        </button><br />
      </div>
      <div className="flex-1 bg-red-400">
        <MapComponent mapContainer={props.mapContainer}
          layers={layers}
        />
      </div>
  </div>);
  
  
}

export default Map;
