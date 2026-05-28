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
 * Poll until the map style is ready, then run `fn`. Stops when the map is
 * torn down or after `maxAttempts` (default 50 × 100ms ≈ 5s).
 */
export const whenMapStyleReady = (
  map: unknown,
  fn: () => void,
  options: { intervalMs?: number; maxAttempts?: number } = {}
): void => {
  const intervalMs = options.intervalMs ?? 100;
  const maxAttempts = options.maxAttempts ?? 50;
  let attempts = 0;

  const check = () => {
    attempts += 1;
    if (isMapStyleUsable(map)) {
      fn();
      return;
    }
    if (!map || attempts >= maxAttempts) return;
    setTimeout(check, intervalMs);
  };

  check();
};
