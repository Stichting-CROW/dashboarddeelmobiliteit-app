import React, {useCallback, useMemo, useState} from 'react';

interface LegendPayloadLike {
  dataKey?: string | number | ((obj: unknown) => unknown);
  value?: unknown;
}

export interface LegendToggle {
  /** Series (dataKeys) currently hidden by the user */
  hiddenSeries: Set<string>;
  /** Returns true if the given series should be hidden */
  isHidden: (dataKey: string) => boolean;
  /** Toggle a series on/off */
  toggleSeries: (dataKey: string) => void;
  /** Props to spread on a Recharts <Legend /> to make it clickable */
  legendProps: {
    onClick: (payload: LegendPayloadLike) => void;
    formatter: (value: unknown, entry: LegendPayloadLike) => React.ReactNode;
    wrapperStyle: React.CSSProperties;
  };
}

/**
 * Makes a Recharts legend interactive: clicking an item hides/shows that
 * series. Hidden items are rendered greyed out. Pass `isHidden(key)` to the
 * `hide` prop of each <Line /> / <Area />.
 */
export function useLegendToggle(): LegendToggle {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());

  const toggleSeries = useCallback((dataKey: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) next.delete(dataKey);
      else next.add(dataKey);
      return next;
    });
  }, []);

  const isHidden = useCallback((dataKey: string) => hiddenSeries.has(dataKey), [hiddenSeries]);

  const legendProps = useMemo(() => ({
    onClick: (payload: LegendPayloadLike) => {
      if (typeof payload?.dataKey === 'string') toggleSeries(payload.dataKey);
    },
    formatter: (value: unknown, entry: LegendPayloadLike) => {
      const hidden = typeof entry?.dataKey === 'string' && hiddenSeries.has(entry.dataKey);
      return (
        <span
          style={{color: hidden ? '#9ca3af' : undefined, textDecoration: hidden ? 'line-through' : undefined}}
          title={hidden ? 'Klik om weer te tonen' : 'Klik om te verbergen'}
        >
          {String(value)}
        </span>
      );
    },
    wrapperStyle: {cursor: 'pointer', userSelect: 'none' as const}
  }), [hiddenSeries, toggleSeries]);

  return {hiddenSeries, isHidden, toggleSeries, legendProps};
}

export default useLegendToggle;
