/**
 * Guards for MapLibre calls during route changes. After `map.remove()` the
 * instance may still be truthy while `getLayer` / `getSource` throw because the
 * internal style is gone.
 */
export const isMapStyleUsable = (map: unknown): boolean => {
  if (!map) return false;
  try {
    const candidate = map as { isStyleLoaded?: () => boolean };
    return typeof candidate.isStyleLoaded === 'function' && candidate.isStyleLoaded();
  } catch {
    return false;
  }
};

/**
 * True when layers and sources can be added or removed: the style object exists
 * and has finished parsing.
 *
 * Deliberately weaker than `isMapStyleUsable`. `map.isStyleLoaded()` also reports
 * false while tiles are still loading or while a freshly added source is pending,
 * which is the normal state right after a `fitBounds` to another municipality.
 * Postponing a layer removal on that signal makes it land seconds later, on top
 * of whatever has been rendered in the meantime.
 */
export const canMutateMapLayers = (map: unknown): boolean => {
  if (!map) return false;
  try {
    const candidate = map as { _removed?: boolean; style?: { _loaded?: boolean } };
    if (candidate._removed) return false;
    const style = candidate.style;
    // `_loaded` is undefined on style implementations that don't expose it; only
    // an explicit `false` means the style is still being parsed.
    return Boolean(style) && style?._loaded !== false;
  } catch {
    return false;
  }
};

interface PollOptions {
  intervalMs?: number;
  maxAttempts?: number;
}

const pollUntil = (
  map: unknown,
  isReady: (map: unknown) => boolean,
  fn: () => void,
  options: PollOptions
): void => {
  const intervalMs = options.intervalMs ?? 100;
  const maxAttempts = options.maxAttempts ?? 50;
  let attempts = 0;

  const check = () => {
    attempts += 1;
    if (isReady(map)) {
      fn();
      return;
    }
    if (!map || attempts >= maxAttempts) return;
    setTimeout(check, intervalMs);
  };

  check();
};

/**
 * Poll until the map style is fully loaded (including tiles), then run `fn`.
 * Stops when the map is torn down or after `maxAttempts` (default 50 × 100ms ≈ 5s).
 */
export const whenMapStyleReady = (map: unknown, fn: () => void, options: PollOptions = {}): void =>
  pollUntil(map, isMapStyleUsable, fn, options);

/**
 * Poll until layers can be mutated, then run `fn`. Prefer this over
 * `whenMapStyleReady` for adding/removing layers and sources, so the work is not
 * postponed for the duration of a pan or zoom.
 */
export const whenMapLayersMutable = (map: unknown, fn: () => void, options: PollOptions = {}): void =>
  pollUntil(map, canMutateMapLayers, fn, options);
