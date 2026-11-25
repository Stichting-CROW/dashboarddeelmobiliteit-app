import { useEffect, useState } from 'react';

import { StatsV3Error, getStatistic } from '../../api/statsV3';
import type { StatisticQuery } from '../../types/StatsV3';

export interface StatisticState<T> {
  data: T | null;
  loading: boolean;
  /** HTTP status of a failed request; 0 for network errors */
  errorStatus: number | null;
}

/**
 * Load one stats_v3 statistic. Pass `null` as query while the prerequisites
 * (token, municipality) are missing. A changed query cancels the previous request.
 */
export const useStatsV3Statistic = <T>(
  token: string | null,
  query: StatisticQuery | null
): StatisticState<T> => {
  const [state, setState] = useState<StatisticState<T>>({
    data: null,
    loading: false,
    errorStatus: null,
  });

  const queryKey = query ? JSON.stringify(query) : null;

  useEffect(() => {
    if (!token || !queryKey) {
      setState({ data: null, loading: false, errorStatus: null });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, errorStatus: null }));

    getStatistic<T>(token, JSON.parse(queryKey) as StatisticQuery, controller.signal)
      .then((data) => {
        setState({ data, loading: false, errorStatus: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Error fetching stats_v3 statistic:', err);
        const status = err instanceof StatsV3Error ? err.status : 0;
        setState({ data: null, loading: false, errorStatus: status });
      });

    return () => controller.abort();
  }, [token, queryKey]);

  return state;
};
