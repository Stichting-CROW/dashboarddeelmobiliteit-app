import React, {useState} from 'react';
import {Map as MapComponent} from '../components/Map/Map.jsx';

import './Map.css';

function SelectLayer(props) {
  const {setLayers, setActiveSource} = props;

  return <div className="SelectLayer absolute right-0">
    <div className="SelectLayer-inner p-2">
      <div data-type="vehicles" className="
        layer
        relative inline-block m-2" onClick={() => {
        setLayers([
          'vehicles-point',
          'zones-geodata',
        ]);
        setActiveSource(
          'vehicles'
        );
      }}>
        <span className="
          layer-title
          block
          absolute
          bottom-0
          left-0
          w-full
          h-6
          flex
          flex-col
          justify-center
        ">
          Vehicles
        </span>
      </div>
      <div data-type="heat-map" className="
        layer
        relative inline-block m-2" onClick={() => {
        setLayers([
          'vehicles-heatmap-city-level',
          'zones-geodata',
        ]);
        setActiveSource(
          'vehicles'
        );
      }}>
        <span className="
          layer-title
          block
          absolute
          bottom-0
          left-0
          w-full
          h-6
          flex
          flex-col
          justify-center
        ">
          Heat map
        </span>
      </div>
      <div data-type="pointers" className="layer
        relative inline-block m-2" onClick={() => {
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
        <span className="
          layer-title
          block
          absolute
          bottom-0
          left-0
          w-full
          h-6
          flex
          flex-col
          justify-center
        ">
          Clusters
        </span>
      </div>
    </div>
  </div>
}

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
