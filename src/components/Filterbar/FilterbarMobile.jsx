import React from 'react';
import MobileSlideBox from '../SlideBox/MobileSlideBox.jsx';
import Filterbar from './Filterbar';
import useUiVisibility from '../../customHooks/useUiVisibility';

// import './FilterbarMobile.css';

function FilterbarMobile({isVisible, displayMode}) {
  const [, setFilterbarVisible] = useUiVisibility('FILTERBAR');

  return (
    <MobileSlideBox
      title="Filters"
      isVisible={isVisible}
      closeHandler={() => {
        setFilterbarVisible(false);
      }}
      classes="
        top-0 overflow-auto
      "
      style={{height: 'calc(100% - 60px)'}}
    >
      <Filterbar hideLogo={true} displayMode={displayMode} />
    </MobileSlideBox>
  )
}

export default FilterbarMobile;
