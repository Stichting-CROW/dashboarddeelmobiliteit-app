import {useCallback, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';

import {StateType} from '../../types/StateType';

export type ChartDataFetcher<T> = (
  token: string | null,
  filter: any,
  zones: any[],
  metadata: any
) => Promise<T | undefined | null>;

export interface AggregatedChartDataState<T> {
  /** Latest successfully fetched data, or null when nothing (valid) was returned */
  data: T | null;
  /** True while the first fetch for this selection is in flight and no data is shown yet */
  isLoading: boolean;
  /** True while a fetch is in flight but previous data is still being shown */
  isRefreshing: boolean;
  /** Set when the fetch threw (network error, invalid JSON, ...) */
  error: Error | null;
  /** Re-run the fetch for the current selection */
  refetch: () => void;
}

/**
 * Shared data-loading logic for the statistics charts.
 *
 * - Waits until `metadata.zones` for the selected plaats is available, so we
 *   never request NL-wide data by accident.
 * - Re-fetches when any relevant filter or metadata slice changes. We depend
 *   on individual metadata sub-references on purpose: the metadata reducer
 *   creates a new top-level object on every dispatch, which would otherwise
 *   trigger duplicate fetches.
 * - Ignores responses that arrive after a newer request was started, so a
 *   slow response for a previous selection can never overwrite fresh data.
 * - Exposes loading / refreshing / error state so charts can render proper
 *   feedback instead of an empty axis.
 *
 * @param fetcher Async function returning the raw API data for the current
 *   filter, or undefined when the API has no data for this selection.
 * @param onData Optional side effect that runs once per successful fetch
 *   (e.g. dispatching operator totals to the store).
 */
export interface UseAggregatedChartDataOptions {
  /**
   * Set when the fetcher always requests a fixed aggregation level (e.g. the
   * KPI row, which works on day-level data), so switching the interval in
   * the UI does not trigger a needless refetch.
   */
  ignoreAggregationLevel?: boolean;
}

export function useAggregatedChartData<T>(
  fetcher: ChartDataFetcher<T>,
  onData?: (data: T) => void,
  options: UseAggregatedChartDataOptions = {}
): AggregatedChartDataState<T> {
  const token = useSelector((state: StateType) =>
    state.authentication?.user_data?.token ? state.authentication.user_data.token : null
  );
  const filter = useSelector((state: StateType) => state.filter);
  const metadata = useSelector((state: StateType) => state.metadata);
  const zones = useSelector((state: StateType) =>
    state.metadata?.zones ? state.metadata.zones : []
  );

  const [data, setData] = useState<T | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  // Identifies the most recent request; older responses are dropped.
  const requestIdRef = useRef(0);
  // Keep the latest callbacks without making them effect dependencies.
  const fetcherRef = useRef(fetcher);
  const onDataRef = useRef(onData);
  fetcherRef.current = fetcher;
  onDataRef.current = onData;

  const refetch = useCallback(() => setRefetchCounter((c) => c + 1), []);

  useEffect(() => {
    // Do not load until we have zones
    if (!metadata?.zones || metadata.zones.length <= 0) {
      requestIdRef.current += 1;
      setData(null);
      setIsFetching(false);
      setError(null);
      return;
    }
    // If a plaats is selected but metadata.zones still belongs to a previous
    // plaats, skip the fetch. Otherwise we would request without a valid zone
    // filter and the API returns NL-wide data.
    if (filter.gebied && !metadata.zones.some((z: any) => z.municipality === filter.gebied)) {
      requestIdRef.current += 1;
      setData(null);
      setIsFetching(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    setIsFetching(true);
    setError(null);

    (async () => {
      try {
        const result = await fetcherRef.current(token, filter, zones, metadata);
        if (!isCurrent()) return;
        if (result) {
          setData(result);
          onDataRef.current?.(result);
        } else {
          setData(null);
        }
      } catch (err) {
        if (!isCurrent()) return;
        console.error('Error loading chart data', err);
        setData(null);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (isCurrent()) setIsFetching(false);
      }
    })();
  }, [
    filter.ontwikkelingvan,
    filter.ontwikkelingtot,
    options.ignoreAggregationLevel ? null : filter.ontwikkelingaggregatie,
    filter.ontwikkelingaggregatie_function,
    filter.gebied,
    filter.zones,
    filter.aanbiedersexclude,
    metadata?.aanbieders,
    metadata?.aclOperators,
    metadata?.zones,
    metadata?.gebieden,
    metadata?.vehicle_types,
    token,
    refetchCounter
  ]);

  return {
    data,
    isLoading: isFetching && data === null,
    isRefreshing: isFetching && data !== null,
    error,
    refetch
  };
}

export default useAggregatedChartData;
