import React from 'react';
import {
  useSelector
} from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';
import Filterbar from '../Filterbar/Filterbar.jsx';

import {StateType} from '../../types/StateType';

function FilterbarDesktop({isVisible, displayMode}) {

  const isFilterBarExtendedVisible = useSelector((state: StateType) => {
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
        <Filterbar displayMode={displayMode} />
      </div>
    </SlideBox>
  )
}

export default FilterbarDesktop
