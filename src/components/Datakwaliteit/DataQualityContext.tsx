import React, { createContext, useContext, useMemo } from 'react';
import type { DataQualityPeriod, OperatorDataQuality } from '../../types/DataQuality';
import type { UseDataQualityDataResult } from './useDataQualityData';

interface DataQualityContextValue {
  operatorsById: Map<string, OperatorDataQuality>;
  period: DataQualityPeriod | null;
  now: number;
  loading: boolean;
  error: string | null;
}

const DataQualityContext = createContext<DataQualityContextValue | null>(null);

interface DataQualityProviderProps {
  data: UseDataQualityDataResult;
  children: React.ReactNode;
}

/** Shares one data quality fetch with every card on a page. */
export const DataQualityProvider = ({ data, children }: DataQualityProviderProps) => {
  const { operators, period, now, loading, error } = data;
  const value = useMemo<DataQualityContextValue>(() => ({
    operatorsById: new Map(operators.map((operator) => [operator.system_id, operator])),
    period,
    now,
    loading,
    error,
  }), [operators, period, now, loading, error]);

  return <DataQualityContext.Provider value={value}>{children}</DataQualityContext.Provider>;
};

export interface OperatorDataQualityResult {
  operator: OperatorDataQuality | null;
  period: DataQualityPeriod | null;
  now: number;
}

/** Returns null outside a DataQualityProvider, while loading, or after an error. */
export const useOperatorDataQuality = (
  systemId: string | null | undefined
): OperatorDataQualityResult | null => {
  const context = useContext(DataQualityContext);
  return useMemo(() => {
    if (!context || context.loading || context.error || !systemId) return null;
    return {
      operator: context.operatorsById.get(systemId) ?? null,
      period: context.period,
      now: context.now,
    };
  }, [context, systemId]);
};
