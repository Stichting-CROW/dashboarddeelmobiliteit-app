import React from 'react';
import SlideBox from '../SlideBox/SlideBox.jsx';
import Filterbar from './Filterbar';
import useFilterbarExtended from '../../customHooks/useFilterbarExtended';

function FilterbarDesktop({isVisible, displayMode}) {
  const { isOpen: isFilterBarExtendedVisible } = useFilterbarExtended();

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
      <div className="py-5 mx-5 h-full">
        <Filterbar displayMode={displayMode} />
      </div>
    </SlideBox>
  )
}

export default FilterbarDesktop
