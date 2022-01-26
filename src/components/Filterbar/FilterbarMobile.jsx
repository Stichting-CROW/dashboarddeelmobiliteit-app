import React from 'react';
import { useDispatch } from 'react-redux';
import MobileSlideBox from '../SlideBox/MobileSlideBox.jsx';
import Filterbar from '../Filterbar/Filterbar.jsx';

// import './FilterbarMobile.css';

function FilterbarMobile({isVisible, displayMode}) {
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
      isVisible={isVisible}
      closeHandler={() => {
        setVisibility();
      }}
      classes="
        top-0 overflow-auto
      "
      style={{height: 'calc(100vh - 60px)'}}
    >
      <Filterbar hideLogo={true} displayMode={displayMode} />
    </MobileSlideBox>
  )
}

export default FilterbarMobile;
