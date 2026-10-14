import { useCallback, useEffect, useId, useRef } from 'react';
import { IconButtonClose } from '../IconButtons.jsx';
import useDismissOnOutsideInteraction from '../../customHooks/useDismissOnOutsideInteraction';

import './css/FilterbarExtended.css';

function FilterbarExtended({closeFunction, title, children}) {
  const filterbarRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const titleId = useId();

  const dismiss = useCallback(() => {
    closeFunction(false);
  }, [closeFunction]);

  // Dismiss when the user clicks outside or presses Escape. Scrollbar clicks
  // on the surrounding SlideBox panel are treated as "inside" so vertical
  // scrolling of the parent doesn't close the dialog.
  useDismissOnOutsideInteraction({
    ref: filterbarRef,
    onDismiss: dismiss,
    scrollContainerSelector: '.SlideBox-inner, .MobileSlideBox',
  });

  // Focus management: remember currently focused element on mount, restore it
  // on unmount. Move focus into the panel unless a child element (e.g. an
  // input with autoFocus) has already claimed it.
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

  return (
    <div
      className="FilterbarExtended"
      ref={filterbarRef}
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
