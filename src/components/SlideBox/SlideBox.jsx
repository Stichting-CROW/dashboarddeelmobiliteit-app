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
    `} ref={containerRef}>
    <div className="
      SlideBox-inner
      px-1
      h-full
    " style={{backgroundColor: backgroundColor}}>
      {props.children}
    </div>
    <div
      className="SlideBox-toggle-wrapper"
      onClick={() => toggleSlideBox()}
      >
      <div
        className="Slidebox-toggle"
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
