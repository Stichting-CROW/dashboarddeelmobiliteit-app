import React, {
  useRef,
} from 'react';
import { useDispatch } from 'react-redux';
import useUiVisibility from '../../customHooks/useUiVisibility';
import { FILTERBAR_EXTENDED_CLOSED } from '../../types/FilterbarExtendedState';

import './SlideBox.css';

function SlideBox(props) {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const NAME = props.name.toUpperCase();

  const [isVisible, setVisible] = useUiVisibility(NAME);

  // Show/hide slidebox on toggle click
  const toggleSlideBox = () => {
    // If filterbar was visible, hide extended filterbar
    if(isVisible) {
      dispatch({
        type: 'SET_FILTERBAR_EXTENDED',
        payload: FILTERBAR_EXTENDED_CLOSED,
      });
    }
    // Now toggle slidebox
    setVisible(!isVisible)
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
