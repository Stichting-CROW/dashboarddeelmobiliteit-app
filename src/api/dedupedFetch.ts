/**
 * In-flight request deduplication for GET requests.
 *
 * When multiple components request the same URL simultaneously (e.g. several
 * charts on /stats/beleidsinfo that all call getAggregatedVehicleData with the
 * same filter parameters), we want to issue a single network request and share
 * the response.
 *
 * The dedup window is the lifetime of the in-flight promise: as soon as the
 * fetch settles (success or failure), the cache entry is cleared so the next
 * call re-fetches fresh data.
 */

type FetchInit = RequestInit | undefined;

const inflight = new Map<string, Promise<Response>>();

const buildKey = (input: RequestInfo | URL, init?: FetchInit): string => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
        // Only GET/HEAD are safe to dedupe; use a unique key for others.
        return `${method}:${url}:${Math.random()}`;
    }
    // Include Authorization header (if any) in the key so requests for
    // different users do not share a cached response.
    let auth = '';
    const headers = init?.headers as Record<string, string> | undefined;
    if (headers) {
        auth = headers['authorization'] || headers['Authorization'] || '';
    }
    return `${method}:${url}:${auth}`;
};

/**
 * Drop-in wrapper around `fetch` that deduplicates concurrent GET requests.
 * Returns a cloned Response so each caller can read the body independently.
 */
export const dedupedFetch = (input: RequestInfo | URL, init?: FetchInit): Promise<Response> => {
    const key = buildKey(input, init);
    const existing = inflight.get(key);
    if (existing) {
        return existing.then((response) => response.clone());
    }

    const promise = fetch(input, init).finally(() => {
        // Clear once the request finishes so subsequent calls fetch fresh data.
        if (inflight.get(key) === promise) {
            inflight.delete(key);
        }
    });

    inflight.set(key, promise);
    // Clone on the first read too, so the cached promise can be replayed for
    // a follower that arrives before the original consumer has read the body.
    return promise.then((response) => response.clone());
};
