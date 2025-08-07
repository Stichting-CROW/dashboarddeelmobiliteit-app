import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';

import SelectLayerModal from './SelectLayerModal';
import Modal from '../Modal/Modal';
import NewFeatureIndicator from '../NewFeatureIndicator/NewFeatureIndicator';

import './SelectLayer.css';

import {
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
} from '../../reducers/layers.js';

import {getMapStyles, applyMapStyle} from '../Map/MapUtils/map.js';

function SelectLayer() {
  
  const showZoneOnOff = useSelector((state) => {
    return state.filter ? state.filter.gebied!=='' : false;
  });

  const userData = useSelector((state) => {
    return state.authentication.user_data;
  });

  const [showModal, setShowModal] = useState(false);

  return <>
    <NewFeatureIndicator 
      featureId="select-layer-button"
      version="2025-08-06"
    >
      <div className="SelectLayer" style={{zIndex: 1}}>
        <div
          className="
            h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors
          "
          onClick={() => {
            setShowModal(! showModal);
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
      </div>
    </NewFeatureIndicator>

    {showModal && <Modal
      isVisible={showModal}
      title="Wijzig lagen"
      button2Title={"Sluiten"}
      button2Handler={async (e) => {
        e.preventDefault();
        // Hide modal
        setShowModal(false);
      }}
      hideModalHandler={() => {
        // Hide modal
        setShowModal(false);
      }}
      config={{
        // fullWidth: true
      }}
    >
      <SelectLayerModal />
    </Modal>}

  </>
}

export {
  SelectLayer
}
