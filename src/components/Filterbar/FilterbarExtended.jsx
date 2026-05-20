import { useRef, useEffect } from 'react';
import { IconButtonClose } from '../IconButtons.jsx';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, title, children}) {
  const filterbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!filterbarRef.current) {
        return;
      }

      const target = event.target;
      const isClickInside = filterbarRef.current.contains(target);

      if (!isClickInside) {
        closeFunction(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeFunction]);

  const handleContainerMouseDown = (e) => {
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
