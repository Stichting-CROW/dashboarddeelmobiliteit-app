import React from 'react';
import {
  // useDispatch,
  useSelector
} from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import Filterbar from '../Filterbar/Filterbar.jsx';

// import './FilterbarDesktop.css';

// import {
//   DISPLAYMODE_PARKEERDATA_HEATMAP,
//   DISPLAYMODE_PARKEERDATA_CLUSTERS,
//   DISPLAYMODE_PARKEERDATA_VOERTUIGEN
// } from '../../reducers/layers.js';

function FilterbarDesktop({isVisible}) {

  const isFilterBarExtendedVisible = useSelector(state => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

  return (
    <SlideBox name="FilterBar" direction="left" options={{
      title: 'Filters',
      backgroundColor: '#F6F5F4',
    }} style={{
      width: (isFilterBarExtendedVisible ? '648px' : '324px'),
      height: '100%',
      top: 0,
      position: 'fixed'
    }}
    >
      <div className="py-2 mx-3 h-full">
        <Filterbar />
      </div>
    </SlideBox>
  )
}

export default FilterbarDesktop
