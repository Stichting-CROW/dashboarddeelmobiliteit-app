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
        name: 'FILTERBAR',
        visibility: false
      }
    })
  };

  return (
    <MobileSlideBox
      title="Filters"
      isVisible={props.isVisible}
      closeHandler={() => {
        setVisibility();
      }}
      classes="
        top-0 overflow-auto
      "
    >
      <Filterbar hideLogo={true} />
    </MobileSlideBox>
  )
}

export default FilterbarMobile;
