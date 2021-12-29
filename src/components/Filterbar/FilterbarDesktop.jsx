import React from 'react';
// import { useDispatch, useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import Filterbar from '../Filterbar/Filterbar.jsx';

// import './FilterbarDesktop.css';

// import {
//   DISPLAYMODE_PARKEERDATA_HEATMAP,
//   DISPLAYMODE_PARKEERDATA_CLUSTERS,
//   DISPLAYMODE_PARKEERDATA_VOERTUIGEN
// } from '../../reducers/layers.js';

function FilterbarDesktop({isVisible}) {
  return (
    <SlideBox name="FilterBar" direction="left" options={{
      title: 'Filters',
      backgroundColor: '#F6F5F4',
    }} style={{
      width: '324px',
      height: '100%',
      top: 0,
      position: 'fixed'
    }}
    isVisible={isVisible}
    >
      <Filterbar />
    </SlideBox>
  )
}

export default FilterbarDesktop
