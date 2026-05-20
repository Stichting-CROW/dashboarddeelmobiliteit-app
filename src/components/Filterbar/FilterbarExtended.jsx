import { useEffect, useId, useRef } from 'react';
import { IconButtonClose } from '../IconButtons.jsx';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, title, children}) {
  const filterbarRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const titleId = useId();

  // Focus management: remember currently focused element on mount, restore it on
  // unmount. Move focus into the panel unless a child element (e.g. an input
  // with autoFocus) has already claimed it.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;

    const panel = filterbarRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      panel.focus({ preventScroll: true });
    }

    return () => {
      const previous = previouslyFocusedRef.current;
      if (previous instanceof HTMLElement && document.contains(previous)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!filterbarRef.current) {
        return;
      }
      if (!filterbarRef.current.contains(event.target)) {
        closeFunction(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeFunction(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeFunction]);

  const handleContainerMouseDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="FilterbarExtended"
      ref={filterbarRef}
      onMouseDown={handleContainerMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Uitgebreid filter'}
      tabIndex={-1}
    >
      <div className="">
        <div className="flex justify-between">
          <h1
            id={title ? titleId : undefined}
            className="title flex flex-col justify-center"
          >
            {title || ''}
          </h1>
          <div className="FilterbarExtended-close-button-wrapper">
            <IconButtonClose
              onClick={() => closeFunction(false)}
              ariaLabel="Sluit filter"
            />
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
