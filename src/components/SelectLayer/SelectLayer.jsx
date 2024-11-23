import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';

import {StateType} from '../../types/StateType';

import SelectLayerModal from './SelectLayerModal';
import Modal from '../Modal/Modal';

import './SelectLayer.css';

import {
  DISPLAYMODE_PARKEERDATA_VOERTUIGEN,
  DISPLAYMODE_VERHUURDATA_VOERTUIGEN,
} from '../../reducers/layers.js';

import {getMapStyles, applyMapStyle} from '../Map/MapUtils/map.js';

function SelectLayer() {
  
  const showZoneOnOff = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied!=='' : false;
  });


  
  const userData = useSelector((state: StateType) => {
    return state.authentication.user_data;
  });

  const [showModal, setShowModal] = useState(false);

  return <>
    <div className="SelectLayer absolute top-0 right-1" style={{zIndex: 1}}>
      <div data-type="heat-map" className={`layer layer-inactive`}
        onClick={() => {
          setShowModal(! showModal);
        }}>
        <span className="layer-title">
          Wijzig lagen
        </span>
      </div>
    </div>

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