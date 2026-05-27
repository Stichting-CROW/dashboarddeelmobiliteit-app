/**
 * Route helpers.
 *
 * The app renders a single full-screen MapLibre map (`MapPage`) behind the
 * routed content. Many routes (stats dashboards, docs, profile, etc.) sit on
 * top of the map with an opaque overlay, so initializing MapLibre and
 * downloading the base-map (or satellite) tiles for those routes is pure
 * waste: the user never sees the map. This helper centralises the
 * allow-list of paths that actually need the background map so we can skip
 * the heavy initialisation everywhere else.
 */

/**
 * Returns true when the current route should render the full-screen
 * background MapPage. Conservatively matches only the explicitly map-driven
 * routes; anything else (stats, docs, admin lists, etc.) gets no background
 * map and therefore no network requests for map style, glyphs, sprites, or
 * raster tiles.
 */
export const pathRequiresBackgroundMap = (pathname: string | null | undefined): boolean => {
    if (!pathname) return true; // fail-open so we never accidentally hide the map

    // Root path: defaults to /map/park behaviour.
    if (pathname === '/' || pathname === '') return true;

    // Public + admin map views.
    if (pathname.startsWith('/map/')) return true;
    if (pathname === '/admin/zones' || pathname.startsWith('/admin/zones/')) return true;

    // /start variants render the StartPage but the visual treatment still
    // benefits from the map being primed; keep the historical behaviour.
    if (pathname.startsWith('/start')) return true;

    return false;
};
