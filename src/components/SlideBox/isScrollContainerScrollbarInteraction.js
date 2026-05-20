const SCROLLBAR_FALLBACK_SIZE = 15;

function isScrollContainerScrollbarInteraction(event, element) {
  if (!(element instanceof Element)) {
    return false;
  }

  if (event.target === element) {
    return true;
  }

  const rect = element.getBoundingClientRect();
  const scrollbarWidth = element.offsetWidth - element.clientWidth;
  const scrollbarHeight = element.offsetHeight - element.clientHeight;
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

export default isScrollContainerScrollbarInteraction;
