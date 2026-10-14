import { RefObject, useEffect, useRef } from 'react';

const SCROLLBAR_FALLBACK_SIZE = 15;

interface PointerLike {
  target: EventTarget | null;
  clientX: number;
  clientY: number;
}

/**
 * Treat a click on the element's scrollbar gutter as "inside" the element.
 * Native scrollbar interactions set event.target to the scroll container
 * itself, but on some platforms (overlay scrollbars) the target is a child
 * element while the coordinates fall in the gutter, so we check both.
 */
function isScrollbarHit(event: PointerLike, element: Element): boolean {
  if (event.target === element) {
    return true;
  }

  const rect = element.getBoundingClientRect();
  const htmlEl = element as HTMLElement;
  const scrollbarWidth = htmlEl.offsetWidth - htmlEl.clientWidth;
  const scrollbarHeight = htmlEl.offsetHeight - htmlEl.clientHeight;
  const effectiveWidth = scrollbarWidth > 0 ? scrollbarWidth : SCROLLBAR_FALLBACK_SIZE;
  const effectiveHeight = scrollbarHeight > 0 ? scrollbarHeight : SCROLLBAR_FALLBACK_SIZE;

  const inVerticalScrollbar =
    event.clientX >= rect.right - effectiveWidth &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  const inHorizontalScrollbar =
    event.clientY >= rect.bottom - effectiveHeight &&
    event.clientY <= rect.bottom &&
    event.clientX >= rect.left &&
    event.clientX <= rect.right;

  return inVerticalScrollbar || inHorizontalScrollbar;
}

function isInsideTargets(
  event: PointerLike,
  dialogEl: Element | null,
  scrollContainerEl: Element | null,
): boolean {
  if (!dialogEl) {
    return false;
  }
  const node = event.target instanceof Node ? event.target : null;
  if (node && dialogEl.contains(node)) {
    return true;
  }
  if (scrollContainerEl && node && scrollContainerEl.contains(node)) {
    return true;
  }
  if (scrollContainerEl && isScrollbarHit(event, scrollContainerEl)) {
    return true;
  }
  return false;
}

interface Options {
  ref: RefObject<HTMLElement | null>;
  onDismiss: () => void;
  enabled?: boolean;
  /**
   * Optional CSS selector resolved via `ref.current.closest(selector)`. Clicks
   * that land on this ancestor (including its scrollbar gutter) are also
   * treated as "inside", so e.g. scrolling a parent panel doesn't dismiss.
   */
  scrollContainerSelector?: string;
}

/**
 * Dismiss a popover/dialog when the user interacts outside of it.
 *
 * - Pairs `pointerdown` with `click`: only dismisses when BOTH happened
 *   outside. This prevents text-selection drags that start inside and end
 *   outside (or vice versa) from dismissing the surface.
 * - Treats scrollbar interactions on an optional ancestor scroll container
 *   as "inside", so users can scroll the surrounding panel without losing
 *   the open dialog.
 * - Dismisses on Escape.
 *
 * Listeners are attached in capture phase so child `stopPropagation()` calls
 * cannot suppress them.
 */
function useDismissOnOutsideInteraction({
  ref,
  onDismiss,
  enabled = true,
  scrollContainerSelector,
}: Options): void {
  const downWasOutsideRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // The dialog may be present in the DOM but hidden by a `display: none`
    // ancestor (e.g. a responsive variant: mobile and desktop wrappers are
    // both mounted, only one is laid out). A hidden instance should not react
    // to interactions; otherwise it will dismiss the shared visibility flag
    // and close the visible variant.
    const isLaidOut = (): boolean => {
      const dialog = ref.current;
      return !!dialog && dialog.getClientRects().length > 0;
    };

    const resolveScrollContainer = (): Element | null => {
      const dialog = ref.current;
      if (!dialog || !scrollContainerSelector) {
        return null;
      }
      return dialog.closest(scrollContainerSelector);
    };

    const handlePointerDown = (event: PointerEvent): void => {
      if (!isLaidOut()) {
        downWasOutsideRef.current = false;
        return;
      }
      downWasOutsideRef.current = !isInsideTargets(
        event,
        ref.current,
        resolveScrollContainer(),
      );
    };

    const handleClick = (event: MouseEvent): void => {
      const downWasOutside = downWasOutsideRef.current;
      downWasOutsideRef.current = false;
      if (!downWasOutside || !isLaidOut()) {
        return;
      }
      if (!isInsideTargets(event, ref.current, resolveScrollContainer())) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isLaidOut()) {
        onDismiss();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, ref, scrollContainerSelector, onDismiss]);
}

export default useDismissOnOutsideInteraction;
