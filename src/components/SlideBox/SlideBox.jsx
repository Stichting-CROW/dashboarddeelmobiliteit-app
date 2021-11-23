import React, { useRef, useState } from 'react';

import './SlideBox.css';

function SlideBox(props) {
  const containerRef = useRef(null);

  const [isHidden, setIsHidden] = useState(false)

  // Show/hide slidebox on toggle click
  const toggleSlideBox = () => {
    setIsHidden(! isHidden);
  };

  return <div className={`
      SlideBox
      direction-${props.direction}
      relative
      ${isHidden ? 'is-hidden' : ''}
    `} ref={containerRef}>
    <div className="
      SlideBox-inner
      relative
      px-1
    ">
      {props.children}
    </div>
    <div className={`SlideBox-toggle`} onClick={() => toggleSlideBox()}>
      <span>
        Lagen
      </span>
    </div>
  </div>
}

export default SlideBox;
