import React from 'react';

import {SlideBox} from '../SlideBox/SlideBox.jsx';

import './SelectLayer.css';

function SelectLayer(props) {
  const {setLayers, setActiveSource} = props;

  return <div className="
      SelectLayer
      absolute
      mt-3
      right-0
      z-10
    ">
      <SlideBox>
        <div data-type="vehicles" className="
          layer
          relative inline-block my-3 mx-1" onClick={() => {
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
            Voertuigen
          </span>
        </div>
        <div data-type="heat-map" className="
          layer
          relative inline-block my-3 mx-1" onClick={() => {
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
          relative inline-block my-3 mx-1" onClick={() => {
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
    </SlideBox>
  </div>
}

export {
  SelectLayer
}