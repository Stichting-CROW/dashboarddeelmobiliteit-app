// Function that gets all available operators
export interface OperatorData {
    system_id: string,
    name: string,
    color: string,
    operator_url?: string
}

/**
 * /operators is global metadata that is effectively static for the duration of a
 * session. To keep the app instant on subsequent loads we use a layered cache:
 *
 *  1. In-memory cache (`cachedOperators`) for the lifetime of the page.
 *  2. localStorage cache (stale-while-revalidate) so a fresh page load can
 *     render filters immediately while a background refresh keeps the data up
 *     to date.
 *  3. In-flight request de-duplication so a burst of concurrent callers (e.g.
 *     React StrictMode double-mount or multiple components) share a single
 *     network request.
 */
const LS_CACHE_KEY = 'ddm-operators-cache-v1';
const LS_CACHE_TS_KEY = 'ddm-operators-cache-v1-ts';
// How long the localStorage cache is considered "fresh". When the cache is
// older than this, we still return it immediately but trigger a background
// refresh so the UI gets the latest data without making the user wait.
const CACHE_FRESH_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cachedOperators: OperatorData[] | null = null;
let inFlightOperatorsRequest: Promise<OperatorData[] | false> | null = null;

const isOperatorData = (value: unknown): value is OperatorData =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as OperatorData).system_id === 'string' &&
    typeof (value as OperatorData).name === 'string';

const readLocalStorageCache = (): { operators: OperatorData[]; timestamp: number } | null => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(LS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        if (!parsed.every(isOperatorData)) return null;
        const tsRaw = window.localStorage.getItem(LS_CACHE_TS_KEY);
        const timestamp = tsRaw ? parseInt(tsRaw, 10) : 0;
        return { operators: parsed, timestamp: Number.isFinite(timestamp) ? timestamp : 0 };
    } catch {
        return null;
    }
};

const writeLocalStorageCache = (operators: OperatorData[]) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(LS_CACHE_KEY, JSON.stringify(operators));
        window.localStorage.setItem(LS_CACHE_TS_KEY, String(Date.now()));
    } catch {
        // Best-effort; ignore quota or serialization errors.
    }
};

/**
 * Synchronously returns operators from the in-memory or localStorage cache so
 * callers can paint the UI on first render without awaiting the network. The
 * caller is expected to follow up with `fetchOperators()` to refresh the data.
 */
export const getCachedOperators = (): OperatorData[] | null => {
    if (cachedOperators) return cachedOperators;
    const stored = readLocalStorageCache();
    if (stored) {
        cachedOperators = stored.operators;
        return stored.operators;
    }
    return null;
};

const fetchOperatorsFromNetwork = async (): Promise<OperatorData[] | false> => {
    try {
        const url = `https://mds.dashboarddeelmobiliteit.nl/operators`;
        const response = await fetch(url);
        const result: { operators: OperatorData[] } = await response.json();
        const operators = result.operators.map((operator) => operator);
        cachedOperators = operators;
        writeLocalStorageCache(operators);
        return operators;
    } catch (error) {
        console.error('Error fetching operators', error);
        return false;
    }
};

export const fetchOperators = async (): Promise<OperatorData[] | false> => {
    if (cachedOperators) {
        return cachedOperators;
    }

    // If localStorage holds a fresh cache, hydrate the in-memory cache from it
    // and skip the network entirely. This keeps subsequent page loads instant.
    const stored = readLocalStorageCache();
    if (stored) {
        cachedOperators = stored.operators;
        const isFresh = stored.timestamp > 0 && Date.now() - stored.timestamp < CACHE_FRESH_TTL_MS;
        if (isFresh) {
            return stored.operators;
        }
        // Stale: return cached value immediately, but kick off a background
        // refresh so the next read sees the latest data.
        if (!inFlightOperatorsRequest) {
            const refresh = fetchOperatorsFromNetwork().finally(() => {
                if (inFlightOperatorsRequest === refresh) {
                    inFlightOperatorsRequest = null;
                }
            });
            inFlightOperatorsRequest = refresh;
        }
        return stored.operators;
    }

    if (inFlightOperatorsRequest) {
        return inFlightOperatorsRequest;
    }

    const promise = fetchOperatorsFromNetwork();
    inFlightOperatorsRequest = promise;
    try {
        return await promise;
    } finally {
        if (inFlightOperatorsRequest === promise) {
            inFlightOperatorsRequest = null;
        }
    }
};
