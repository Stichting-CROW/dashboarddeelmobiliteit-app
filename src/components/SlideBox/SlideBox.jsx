import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import './SlideBox.css';

function SlideBox(props) {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const NAME = props.name.toUpperCase();

  const isVisible = useSelector(state => {
    return state.ui ? state.ui[NAME] : false;
  });

  // Show/hide slidebox on toggle click
  const toggleSlideBox = () => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: NAME,
        visibility: ! isVisible
      }
    })
  };

  const {backgroundColor} = props.options || {};

  return <div className={`
      SlideBox
      direction-${props.direction}
      relative
      ${isVisible ? '' : 'is-hidden'}
      z-10
    `} ref={containerRef} style={props.style || {}}>
    <div className="
      SlideBox-inner
    " style={{backgroundColor: backgroundColor}}>
      {props.children}
    </div>
    <div
      className="SlideBox-toggle-wrapper z-10 overflow-hidden"
      >
      <div
        className="SlideBox-toggle"
        onClick={() => toggleSlideBox()}
        style={{backgroundColor: backgroundColor}}
        >
        <span>
          {props.options.title || 'Lagen'}
        </span>
      </div>
    </div>
  </div>
}

export default SlideBox;
