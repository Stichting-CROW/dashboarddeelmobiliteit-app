import { RefObject, useLayoutEffect, useState } from 'react';

/** Current content-box width of the referenced element in px (0 until measured). */
function useElementWidth<T extends HTMLElement>(ref: RefObject<T>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export default useElementWidth;
