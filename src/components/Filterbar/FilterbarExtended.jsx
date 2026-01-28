import { useRef, useEffect } from 'react';
import { IconButtonClose } from '../IconButtons.jsx';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, title, children}) {
  const filterbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only proceed if ref is set
      if (!filterbarRef.current) {
        return;
      }

      // Check if the click target is inside the component
      const target = event.target;
      const isClickInside = filterbarRef.current.contains(target);

      // Only close if click is truly outside
      if (!isClickInside) {
        closeFunction(false);
      }
    };

    // Add event listener after component mounts
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeFunction]);

  const handleContainerMouseDown = (e) => {
    // Stop propagation to prevent the document listener from firing
    // This ensures clicks inside don't trigger the outside click handler
    e.stopPropagation();
  };

  return (
    <div className="FilterbarExtended" ref={filterbarRef} onMouseDown={handleContainerMouseDown}>
      <div className="">
        <div className="flex justify-between">
          <h1 className="title flex flex-col justify-center">
            {title||''}
          </h1>
          <div className="FilterbarExtended-close-button-wrapper">
            <IconButtonClose onClick={() => closeFunction(false)} />
          </div>
        </div>
        <div className="grid-cols-4" >
          { children }
        </div>
      </div>
    </div>
  )
}

export default FilterbarExtended;
