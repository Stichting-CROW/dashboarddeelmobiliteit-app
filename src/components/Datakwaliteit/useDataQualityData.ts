import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { StateType } from '../../types/StateType';
import type {
  DataQualityPeriod,
  FeedAvailability,
  ManualRejection,
  ManualRejectionInput,
  OperatorDataQuality,
} from '../../types/DataQuality';
import {
  createManualRejection,
  deleteManualRejection,
  getFeedAvailability,
  getManualRejections,
  updateManualRejection,
} from '../../api/dataQuality';
import { isDemoMode } from '../../config/demo';
import { notifyError } from '../../helpers/notify';
import {
  getAanbiederSystemId,
  isOperatorPrestatiesView,
} from '../../helpers/prestatiesAanbiedersViewMode';
import { filterRejections, groupByOperator, parsePeriod } from './dataQualityUtils';
import {
  DEMO_USER,
  buildDemoFeeds,
  buildDemoRejections,
  pickActiveOperators,
} from './dataQualityDemoData';

const DEMO_FALLBACK_SYSTEM_IDS = ['baqme', 'check', 'cykl', 'dott', 'felyx', 'lime'];
const EMPTY_LIST: never[] = [];

export interface UseDataQualityDataResult {
  operators: OperatorDataQuality[];
  /** Rejections shown on at least one visible card (used for CSV export) */
  visibleRejections: ManualRejection[];
  period: DataQualityPeriod | null;
  now: number;
  loading: boolean;
  error: string | null;
  isDemoData: boolean;
  saveRejection: (input: ManualRejectionInput, rejectionId?: number) => Promise<boolean>;
  removeRejection: (rejectionId: number) => Promise<boolean>;
  reload: () => void;
}

export const useDataQualityData = (): UseDataQualityDataResult => {
  const token: string | null = useSelector((state: StateType) =>
    state.authentication?.user_data?.token || null
  );
  const userEmail: string = useSelector((state: StateType) =>
    state.authentication?.user_data?.user?.email || DEMO_USER
  );
  const gmCode: string | null = useSelector((state: StateType) => state.filter?.gebied || null);
  const aanbieders = useSelector((state: StateType) => state.metadata?.aanbieders || EMPTY_LIST);
  const aclOperators = useSelector((state: StateType) =>
    state.metadata?.aclOperators || EMPTY_LIST
  );
  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden || EMPTY_LIST);

  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const period = useMemo(
    () => (startDate && endDate ? parsePeriod(startDate, endDate) : null),
    [startDate, endDate]
  );

  const [feeds, setFeeds] = useState<FeedAvailability[]>([]);
  const [rejections, setRejections] = useState<ManualRejection[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  /** Demo rejections survive filter changes so local edits are kept. */
  const demoRejectionsRef = useRef<ManualRejection[] | null>(null);

  const restrictToSystemIds = useMemo(() => {
    if (!isOperatorPrestatiesView(aclOperators)) return null;
    return [getAanbiederSystemId(aclOperators[0])];
  }, [aclOperators]);

  const allSystemIds = useMemo(() => {
    const ids = aanbieders.map(getAanbiederSystemId).filter(Boolean) as string[];
    return ids.length > 0 ? ids : DEMO_FALLBACK_SYSTEM_IDS;
  }, [aanbieders]);

  const gmCodes = useMemo(
    () => gebieden.map((g: { gm_code?: string }) => g.gm_code).filter(Boolean) as string[],
    [gebieden]
  );

  useEffect(() => {
    demoRejectionsRef.current = null;
  }, [allSystemIds, gmCodes]);

  const loadDemoData = useCallback((activePeriod: DataQualityPeriod, fetchedAt: number) => {
    if (!demoRejectionsRef.current) {
      demoRejectionsRef.current = buildDemoRejections(allSystemIds, gmCodes, fetchedAt);
    }
    const activeSystemIds = pickActiveOperators(allSystemIds, gmCode);
    setFeeds(buildDemoFeeds(activeSystemIds, activePeriod, fetchedAt));
    setRejections(demoRejectionsRef.current);
    setIsDemoData(true);
    setError(null);
  }, [allSystemIds, gmCodes, gmCode]);

  useEffect(() => {
    if (!period || !startDate || !endDate) return;

    let cancelled = false;
    const fetchedAt = Date.now();
    setNow(fetchedAt);

    if (!token) {
      if (isDemoMode()) {
        loadDemoData(period, fetchedAt);
      }
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = { gm_code: gmCode, start_date: startDate, end_date: endDate };
        const [feedResult, rejectionResult] = await Promise.all([
          getFeedAvailability(token, query),
          getManualRejections(token, query),
        ]);
        if (cancelled) return;

        if (feedResult.length === 0 && rejectionResult.length === 0 && isDemoMode()) {
          loadDemoData(period, fetchedAt);
          return;
        }
        setFeeds(feedResult);
        setRejections(rejectionResult);
        setIsDemoData(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching data quality:', err);
        if (isDemoMode()) {
          loadDemoData(period, fetchedAt);
          return;
        }
        setFeeds([]);
        setRejections([]);
        setIsDemoData(false);
        setError('De datakwaliteit kon niet worden geladen. Probeer het later opnieuw.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, gmCode, startDate, endDate, period, reloadKey, loadDemoData]);

  const filteredRejections = useMemo(() => {
    if (!period) return [];
    return filterRejections(rejections, { gmCode, period, now });
  }, [rejections, gmCode, period, now]);

  const operators = useMemo(
    () => groupByOperator(feeds, filteredRejections, restrictToSystemIds),
    [feeds, filteredRejections, restrictToSystemIds]
  );

  const visibleRejections = useMemo(() => {
    const seen = new Map<number, ManualRejection>();
    operators.forEach((operator) => {
      operator.rejections.forEach((rejection) => seen.set(rejection.rejection_id, rejection));
    });
    return Array.from(seen.values()).sort((a, b) => b.start_time.localeCompare(a.start_time));
  }, [operators]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const saveRejection = useCallback(async (
    input: ManualRejectionInput,
    rejectionId?: number
  ): Promise<boolean> => {
    if (isDemoData) {
      const timestamp = new Date().toISOString();
      const current = demoRejectionsRef.current || [];
      const existing = current.find((r) => r.rejection_id === rejectionId);
      const next: ManualRejection[] = existing
        ? current.map((r) => (r.rejection_id === rejectionId
          ? { ...r, ...input, updated_by: userEmail, updated_at: timestamp }
          : r))
        : [...current, {
          ...input,
          rejection_id: Math.max(0, ...current.map((r) => r.rejection_id)) + 1,
          created_by: userEmail,
          created_at: timestamp,
          updated_by: null,
          updated_at: null,
        }];
      demoRejectionsRef.current = next;
      setRejections(next);
      return true;
    }

    if (!token) return false;
    try {
      if (rejectionId !== undefined) {
        await updateManualRejection(token, rejectionId, input);
      } else {
        await createManualRejection(token, input);
      }
      reload();
      return true;
    } catch (err) {
      console.error('Error saving manual rejection:', err);
      notifyError('De afkeuring kon niet worden opgeslagen.');
      return false;
    }
  }, [isDemoData, token, userEmail, reload]);

  const removeRejection = useCallback(async (rejectionId: number): Promise<boolean> => {
    if (isDemoData) {
      const next = (demoRejectionsRef.current || []).filter((r) => r.rejection_id !== rejectionId);
      demoRejectionsRef.current = next;
      setRejections(next);
      return true;
    }

    if (!token) return false;
    try {
      await deleteManualRejection(token, rejectionId);
      reload();
      return true;
    } catch (err) {
      console.error('Error deleting manual rejection:', err);
      notifyError('De afkeuring kon niet worden verwijderd.');
      return false;
    }
  }, [isDemoData, token, reload]);

  return {
    operators,
    visibleRejections,
    period,
    now,
    loading,
    error,
    isDemoData,
    saveRejection,
    removeRejection,
    reload,
  };
};
