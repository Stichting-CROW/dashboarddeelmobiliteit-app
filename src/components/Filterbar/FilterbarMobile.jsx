import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import SlideBox from '../SlideBox/SlideBox.jsx';
import MobileSlideBox from '../SlideBox/MobileSlideBox.jsx';
import Filterbar from '../Filterbar/Filterbar.jsx';

// import './FilterbarMobile.css';

// import {
//   DISPLAYMODE_PARKEERDATA_HEATMAP,
//   DISPLAYMODE_PARKEERDATA_CLUSTERS,
//   DISPLAYMODE_PARKEERDATA_VOERTUIGEN
// } from '../../reducers/layers.js';

function FilterbarMobile(props) {
  const dispatch = useDispatch()

  const setVisibility = () => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: 'FilterBar',
        visibility: false
      }
    })
  };

  return (
    <MobileSlideBox
      title="Lagen"
      isVisible={props.isVisible}
      closeHandler={() => {
        setVisibility();
      }}
    >
      <Filterbar />
    </MobileSlideBox>
  )
}

export default FilterbarMobile;
