import React, { useRef, useState } from 'react';

import './SlideBox.css';

function SlideBox(props) {
  const containerRef = useRef(null);

  const [isHidden, setIsHidden] = useState(false)

  // Show/hide slidebox on toggle click
  const toggleSlideBox = () => {
    setIsHidden(! isHidden);
  };

  const {backgroundColor} = props.options || {};

  return <div className={`
      SlideBox
      direction-${props.direction}
      relative
      ${isHidden ? 'is-hidden' : ''}
      z-10
    `} ref={containerRef} style={props.style || {}}>
    <div className="
      SlideBox-inner
    " style={{backgroundColor: backgroundColor}}>
      {props.children}
    </div>
    <div
      className="SlideBox-toggle-wrapper z-10 overflow-hidden"
      onClick={() => toggleSlideBox()}
      >
      <div
        className="SlideBox-toggle"
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
