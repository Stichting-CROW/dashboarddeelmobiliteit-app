import {
  useRef,
  useEffect,
} from 'react';
import { useSelector } from 'react-redux';

import './MobileSlideBox.css';
import { IconButtonClose } from '../IconButtons.jsx';
import isScrollContainerScrollbarInteraction from './isScrollContainerScrollbarInteraction.js';
import {StateType} from '../../types/StateType';

function MobileSlideBox(props) {
  const containerRef = useRef(null);

  const isFilterBarExtendedVisible = useSelector((state: StateType) => {
    return state.ui ? state.ui['FILTERBAR_EXTENDED'] : false;
  });

  useEffect(() => {
    if (!isFilterBarExtendedVisible) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleMouseDownCapture = (event) => {
      if (isScrollContainerScrollbarInteraction(event, container)) {
        event.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleMouseDownCapture, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDownCapture, true);
    };
  }, [isFilterBarExtendedVisible]);

  return (
    <div
      ref={containerRef}
      className={`
      MobileSlideBox w-full sm:hidden fixed left-0
      ${props.isVisible ? 'is-visible' : ''}
      ${props.classes}
    `} style={props.style}>

      <header className="flex justify-between relative z-10">
        <h1 className="">{props.title}</h1>
        <IconButtonClose onClick={props.closeHandler} />
      </header>

      <div className="w-full">
        {props.children}
      </div>

    </div>
  )
}

export default MobileSlideBox;
