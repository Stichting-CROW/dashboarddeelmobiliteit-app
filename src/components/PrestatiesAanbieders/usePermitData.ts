import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import {
  fetchKpiOverviewPermitRecords,
  getPermitLimitOverviewForOperator,
  type PermitLimitRecord,
  type MunicipalityModalityOperator,
  type PerformanceIndicatorDescription,
} from '../../api/permitLimits';
import { fetchOperators, type OperatorData } from '../../api/operators';
import { getMunicipalityList } from '../../api/municipalities';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';

export type PermitViewType = 'municipality' | 'operator';

export const usePermitData = (viewType: PermitViewType, filterValue: string) => {
  const [permits, setPermits] = useState<PermitLimitRecord[]>([]);
  const [rawKpiOperators, setRawKpiOperators] = useState<MunicipalityModalityOperator[]>([]);
  const [performanceIndicatorDescriptions, setPerformanceIndicatorDescriptions] = useState<
    PerformanceIndicatorDescription[]
  >([]);
  const [availableOperators, setAvailableOperators] = useState<OperatorData[]>([]);
  const [municipalityNames, setMunicipalityNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;

  const token = useSelector((state: StateType) =>
    (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
  );

  const gebieden = useSelector((state: StateType) =>
    (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : []
  );

  const aclOperators = useSelector((state: StateType) =>
    (state.metadata && state.metadata.aclOperators) ? state.metadata.aclOperators : []
  );

  useEffect(() => {
    fetchOperators().then((operators) => {
      if (operators) {
        setAvailableOperators(operators);
      }
    });
  }, []);

  useEffect(() => {
    if (viewType !== 'operator' || !token) {
      return;
    }

    const localNames = new Map<string, string>();
    gebieden.forEach((g: { gm_code?: string; name?: string }) => {
      if (g.gm_code && g.name) {
        localNames.set(g.gm_code, g.name);
      }
    });

    if (localNames.size > 0) {
      setMunicipalityNames(localNames);
      return;
    }

    getMunicipalityList(token)
      .then((list) => {
        const map = new Map<string, string>();
        if (Array.isArray(list)) {
          list.forEach((item: { gm_code?: string; name?: string }) => {
            if (item.gm_code && item.name) {
              map.set(item.gm_code, item.name);
            }
          });
        }
        setMunicipalityNames(map);
      })
      .catch(() => {
        setMunicipalityNames(new Map());
      });
  }, [viewType, token, gebieden]);

  const reloadPermits = useCallback(async () => {
    if (!token || !filterValue) return;

    // Wait until the date range is known. Otherwise the API falls back to a
    // 90-day default range, which races against the follow-up fetch that runs
    // once `FilteritemDatumVanTot` writes the 7-day default into the URL. If
    // the 90-day response arrives last, it overwrites the 7-day result and the
    // page renders 90+ indicator blocks instead of 7.
    if (!startDate || !endDate) {
      setPermits([]);
      setRawKpiOperators([]);
      setPerformanceIndicatorDescriptions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let results: PermitLimitRecord[] | null = null;

      if (viewType === 'municipality') {
        const municipalityResult = await fetchKpiOverviewPermitRecords(token, {
          scope: 'municipality',
          municipality: filterValue,
          start_date: startDate,
          end_date: endDate,
          aclOperators,
        });
        results = municipalityResult?.records ?? null;
        setRawKpiOperators(municipalityResult?.rawOperators ?? []);
        setPerformanceIndicatorDescriptions(
          municipalityResult?.performanceIndicatorDescriptions ?? []
        );
      } else {
        const operatorResult = await getPermitLimitOverviewForOperator(
          token,
          filterValue,
          startDate,
          endDate,
          municipalityNames,
          aclOperators
        );
        results = operatorResult?.records ?? null;
        setRawKpiOperators(operatorResult?.rawOperators ?? []);
        setPerformanceIndicatorDescriptions(
          operatorResult?.performanceIndicatorDescriptions ?? []
        );
      }

      if (results) {
        results = results.filter((record) => record.permit_limit);
        results.forEach((record) => {
          if (!record.municipality) {
            record.municipality = {
              name: record.permit_limit.municipality,
              gmcode: record.permit_limit.municipality,
            };
          }
          if (!record.vehicle_type) {
            record.vehicle_type = {
              id: record.permit_limit.modality,
              name: getPrettyVehicleTypeName(record.permit_limit.modality) || record.permit_limit.modality,
              icon: getVehicleIconUrl(record.permit_limit.modality) || getVehicleIconUrl('other'),
            };
          }
        });
      }

      setPermits(results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [token, filterValue, viewType, startDate, endDate, municipalityNames, aclOperators]);

  useEffect(() => {
    reloadPermits();
  }, [reloadPermits]);

  return {
    permits,
    rawKpiOperators,
    performanceIndicatorDescriptions,
    availableOperators,
    loading,
    error,
    reloadPermits,
    token,
  };
};
