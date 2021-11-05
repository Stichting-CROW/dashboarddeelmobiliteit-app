import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';

function Map(props) {
  const [layers, setLayers] = useState([
    'vehicles-heatmap',
    'vehicles-point',
    'zones-geodata'
  ]);
  const [activeSource, setActiveSource] = useState('vehicles');
  
  return (
    <div className="flex flex-col">
      <div className="flex-none">
        Map type:
        <button onClick={() => {
          setLayers([
            'vehicles-point',
            'zones-geodata',
          ]);
          setActiveSource(
            'vehicles'
          );
        }}>
          Vehicles
        </button> |
        <button className="" onClick={() => {
          setLayers([
            'vehicles-heatmap-city-level',
            'zones-geodata',
          ]);
          setActiveSource(
            'vehicles'
          );
        }}>
          Heatmap
        </button> |
        <button className="" onClick={() => {
          setLayers([
            'vehicles-clusters',
            'vehicles-clusters-count',
            'vehicles-clusters-point',
            'zones-geodata',
          ]);
          setActiveSource(
            'vehicles-clusters'
          );
        }}>
          Clusters
        </button><br />
      </div>
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
