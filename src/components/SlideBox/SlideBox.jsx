import React, {
  useRef,
  useEffect,
  // useState
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import './SlideBox.css';
import isScrollContainerScrollbarInteraction from './isScrollContainerScrollbarInteraction.js';

import {StateType} from '../../types/StateType';

function SlideBox(props) {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const NAME = props.name.toUpperCase();

  const isVisible = useSelector((state: StateType) => {
    return state.ui ? state.ui[NAME] : false;
  });

  const isFilterBarExtendedVisible = useSelector((state: StateType) => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

  useEffect(() => {
    if (NAME !== 'FILTERBAR' || !isFilterBarExtendedVisible) {
      return;
    }

    const inner = innerRef.current;
    if (!inner) {
      return;
    }

    const handleMouseDownCapture = (event) => {
      if (isScrollContainerScrollbarInteraction(event, inner)) {
        event.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleMouseDownCapture, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDownCapture, true);
    };
  }, [NAME, isFilterBarExtendedVisible]);

  const setVisibility = (name, visibility) => {
    dispatch({
      type: `SET_VISIBILITY`,
      payload: {
        name: name,
        visibility: visibility
      }
    })
  }

  // Show/hide slidebox on toggle click
  const toggleSlideBox = () => {
    // If filterbar was visible, hide extended filterbar
    if(isVisible) {
      setVisibility('FILTERBAR_EXTENDED', false);
    }
    // Now toggle slidebox
    setVisibility(NAME, ! isVisible)
  };

  const {backgroundColor} = props.options || {};

  return <div className={`
      SlideBox
      direction-${props.direction}
      relative
      ${isVisible ? '' : 'is-hidden'}
      z-20
    `} ref={containerRef} style={props.style || {}}>
    <div className="
      SlideBox-inner
      h-full
    " ref={innerRef} style={{backgroundColor: backgroundColor}}>
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
