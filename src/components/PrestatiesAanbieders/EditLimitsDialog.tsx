import React, { useState, useCallback, useEffect, useMemo } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Table2, FormInput } from 'lucide-react';
import { getVehicleIconUrl, getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { getProvider } from '../../helpers/providers';
import { isDemoMode } from '../../config/demo';
import { getDemoOperatorName } from '../../helpers/demoMode';
import Modal from '../Modal/Modal.jsx';
import type {
  GeometryOperatorModalityLimit,
  PerformanceIndicatorDescription,
} from '../../api/permitLimits';
import {
  addGeometryOperatorModalityLimit,
  updateGeometryOperatorModalityLimit,
  getOperatorPerformanceIndicators,
  getGeometryOperatorModalityLimitHistory,
  deleteGeometryOperatorModalityLimit,
  toGeometryRef,
} from '../../api/permitLimits';
import { toDateOnly, formatBound, formatUnit, type HistoryTableRow } from './permitLimitsUtils';
import PermitLimitsTable from './PermitLimitsTable';
import PermitLimitsEditor from './PermitLimitsEditor';
import {
  planSetFullRecordAtDate,
  planDeleteRecord,
  findRecordContainingDate,
  randomKpiValue,
  pickRandomSubset,
  type OperationContext,
  type PlannedOp,
} from './permitLimitsOperations';

interface EditLimitsDialogProps {
  isVisible: boolean;
  municipality: string;
  provider_system_id: string;
  vehicle_type: string;
  tableRows: HistoryTableRow[];
  limitHistory: GeometryOperatorModalityLimit[] | null;
  kpiDescriptions: PerformanceIndicatorDescription[];
  mode: 'normal' | 'admin';
  token: string;
  propulsion_type?: string;
  showPermitLimitsEditor?: boolean;
  onClose: () => void;
  onRecordUpdated: () => void;
  onProviderClick?: () => void;
  onVehicleTypeClick?: () => void;
}

const EditLimitsDialog: React.FC<EditLimitsDialogProps> = ({
  isVisible,
  municipality,
  provider_system_id,
  vehicle_type,
  tableRows,
  limitHistory,
  kpiDescriptions,
  mode,
  token,
  propulsion_type = 'electric',
  showPermitLimitsEditor = false,
  onClose,
  onRecordUpdated,
  onProviderClick,
  onVehicleTypeClick,
}) => {
  const provider = getProvider(provider_system_id);
  const realProviderName = provider?.name || provider_system_id;
  const providerName = isDemoMode() ? getDemoOperatorName(provider_system_id) : realProviderName;
  const providerLogo = provider ? provider.logo : createSvgPlaceholder({
    width: 48,
    height: 48,
    text: providerName.slice(0, 2),
    bgColor: '#0F1C3F',
    textColor: '#7FDBFF',
  });
  const vehicleTypeLogo = getVehicleIconUrl(vehicle_type);
  const vehicleTypeName = getPrettyVehicleTypeName(vehicle_type) || vehicle_type;

  const [activeTab, setActiveTab] = useState<'main' | 'test' | 'kpilist'>('main');
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const [useEditorMode, setUseEditorMode] = useState(showPermitLimitsEditor);
  const [showTestTab, setShowTestTab] = useState(false);

  const formModeDefaultDate = useMemo(() => {
    const today = moment().format('YYYY-MM-DD');
    if (!limitHistory || limitHistory.length === 0) return today;
    const sorted = [...limitHistory].sort((a, b) =>
      toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date))
    );
    const onOrBeforeToday = sorted.filter((r) => toDateOnly(r.effective_date) <= today);
    if (onOrBeforeToday.length > 0) {
      return toDateOnly(onOrBeforeToday[onOrBeforeToday.length - 1].effective_date);
    }
    return toDateOnly(sorted[0].effective_date);
  }, [limitHistory]);
  const [showEditor, setShowEditor] = useState(false);

  // Test tab: history state
  const [historyData, setHistoryData] = useState<GeometryOperatorModalityLimit[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // KPI list for Test tab (Insert/Random)
  const [kpiListForTest, setKpiListForTest] = useState<PerformanceIndicatorDescription[] | null>(null);
  const [testActionLoading, setTestActionLoading] = useState<string | null>(null);
  const [testViewMode, setTestViewMode] = useState<'table' | 'graph'>('table');

  const TEST_DATES = ['2026-01-01', '2026-04-01', '2026-07-01', '2026-10-01'];

  // Chart colors for KPI lines (Recharts-friendly)
  const CHART_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];
  const X_AXIS_MAX = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).getTime();

  // Test tab graph: [(t1+1sec,v1),(t2-1sec,v1),(t2+1sec,v2),(t3-1sec,v2),...] per KPI; absent = null (no segment)
  const { testChartData, testChartKpiKeys } = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return { testChartData: [], testChartKpiKeys: [] as string[] };
    }
    const dateToTs = (d: string) => new Date(toDateOnly(d) + 'T12:00:00Z').getTime();
    const SEC = 1000;
    const xAxisMax = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).getTime();
    const sorted = [...historyData].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
    const allKeys = Array.from(new Set(sorted.flatMap((r) => Object.keys(r.limits || {})))).sort();
    const points: Record<string, string | number | null>[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const rec = sorted[i];
      const endDate = toDateOnly(rec.end_date || sorted[i + 1]?.effective_date) || '9999-12-31';
      const xStart = dateToTs(toDateOnly(rec.effective_date)) + SEC;
      const rawXEnd = dateToTs(endDate) - SEC;
      const xEnd = Math.min(rawXEnd, xAxisMax);
      if (xStart > xAxisMax) continue;
      const rowStart: Record<string, string | number | null> = { x: xStart, date: rec.effective_date };
      const rowEnd: Record<string, string | number | null> = { x: xEnd, date: endDate };
      allKeys.forEach((k) => {
        const v = rec.limits && k in rec.limits ? rec.limits[k] : null;
        rowStart[k] = v;
        rowEnd[k] = v;
      });
      points.push(rowStart);
      if (xEnd > xStart) points.push(rowEnd);
    }
    points.sort((a, b) => (a.x as number) - (b.x as number));
    return { testChartData: points, testChartKpiKeys: allKeys };
  }, [historyData]);

  const handleTitleClick = useCallback((e?: React.MouseEvent) => {
    if (e?.shiftKey) {
      if (process.env.NODE_ENV !== 'production') {
        setShowTestTab((prev) => !prev);
      }
    } else {
      setUseEditorMode((prev) => !prev);
      setShowEditor(false);
    }
  }, []);

  useEffect(() => {
    if (!showTestTab && activeTab === 'test') {
      setActiveTab('main');
    }
  }, [showTestTab, activeTab]);

  const handleAddNew = useCallback(() => {
    setFocusDate(null);
    setShowEditor(true);
  }, []);

  const handleEditRow = useCallback((date: string) => {
    setFocusDate(date);
    setShowEditor(true);
  }, []);

  const handleEditorCancel = useCallback(() => {
    setShowEditor(false);
    setFocusDate(null);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setActiveTab('main');
      setFocusDate(null);
      setShowEditor(false);
      setUseEditorMode(showPermitLimitsEditor);
      setShowTestTab(false);
      setHistoryData(null);
      setKpiListForTest(null);
    }
  }, [isVisible, showPermitLimitsEditor]);

  // Reset history when municipality, operator or modality changes
  useEffect(() => {
    setHistoryData(null);
    setKpiListForTest(null);
  }, [municipality, provider_system_id, vehicle_type]);

  // Fetch KPI list when dialog loads (for Test tab)
  useEffect(() => {
    if (!isVisible || !token || !municipality || !provider_system_id || !vehicle_type) return;
    const fetchKpiList = async () => {
      try {
        const result = await getOperatorPerformanceIndicators(token, municipality, provider_system_id, vehicle_type);
        setKpiListForTest(result?.performance_indicator_description ?? null);
      } catch (error) {
        console.error('Error fetching KPI list for test:', error);
        setKpiListForTest(null);
      }
    };
    fetchKpiList();
  }, [isVisible, token, municipality, provider_system_id, vehicle_type]);

  // Fetch history when Test tab is selected
  useEffect(() => {
    if (activeTab !== 'test' || !token || !municipality || !provider_system_id || !vehicle_type) return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryData(null);
      try {
        const geometry_ref = toGeometryRef(municipality);
        const result = await getGeometryOperatorModalityLimitHistory(
          token,
          provider_system_id,
          geometry_ref,
          vehicle_type,
          propulsion_type ?? 'electric'
        );
        setHistoryData(result ?? null);
      } catch (error) {
        console.error('Error fetching history:', error);
        setHistoryData(null);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [activeTab, token, municipality, provider_system_id, vehicle_type, propulsion_type]);

  const getTestContext = useCallback((): OperationContext => ({
    operator: provider_system_id,
    geometry_ref: toGeometryRef(municipality),
    form_factor: vehicle_type,
    propulsion_type: propulsion_type ?? 'electric',
  }), [municipality, provider_system_id, vehicle_type, propulsion_type]);

  const handleTestReset = useCallback(async () => {
    if (!token || !window.confirm('Weet je zeker dat je alle records voor deze context wilt verwijderen?')) return;
    setTestActionLoading('reset');
    try {
      const geometry_ref = toGeometryRef(municipality);
      const history = await getGeometryOperatorModalityLimitHistory(
        token,
        provider_system_id,
        geometry_ref,
        vehicle_type,
        propulsion_type ?? 'electric'
      );
      if (history && history.length > 0) {
        for (const record of history) {
          if (record.geometry_operator_modality_limit_id) {
            await deleteGeometryOperatorModalityLimit(token, record.geometry_operator_modality_limit_id);
          }
        }
      }
      setHistoryData([]);
      onRecordUpdated();
    } catch (error) {
      console.error('Test reset error:', error);
      alert('Fout bij reset');
    } finally {
      setTestActionLoading(null);
    }
  }, [token, municipality, provider_system_id, vehicle_type, propulsion_type, onRecordUpdated]);

  const runPlannedOps = useCallback(async (ops: PlannedOp[]): Promise<GeometryOperatorModalityLimit | null> => {
    if (!token) return null;
    let lastResult: GeometryOperatorModalityLimit | null = null;
    for (const op of ops) {
      if (op.type === 'PUT' && op.record.geometry_operator_modality_limit_id) {
        lastResult = await updateGeometryOperatorModalityLimit(token, op.record, true); // test tab: always allow
      } else if (op.type === 'POST') {
        lastResult = await addGeometryOperatorModalityLimit(token, op.record, true); // test tab: always allow
      }
      if (!lastResult && op.type === 'PUT') break;
    }
    return lastResult;
  }, [token]);

  const handleTestDelete = useCallback(async (date: string) => {
    if (!token || !historyData) return;
    const found = findRecordContainingDate(historyData, date);
    if (!found?.record.geometry_operator_modality_limit_id) {
      alert(`Geen record voor datum ${date}`);
      return;
    }
    const id = found.record.geometry_operator_modality_limit_id;
    setTestActionLoading(`delete-${date}`);
    try {
      const prevToUpdate = planDeleteRecord(historyData, found.record);
      if (prevToUpdate) {
        const updated = await updateGeometryOperatorModalityLimit(token, prevToUpdate, true); // test tab: always allow
        if (!updated) {
          alert('Fout bij bijwerken vorige record');
          return;
        }
      }
      const ok = await deleteGeometryOperatorModalityLimit(token, id);
      if (ok) {
        const geometry_ref = toGeometryRef(municipality);
        const fresh = await getGeometryOperatorModalityLimitHistory(
          token,
          provider_system_id,
          geometry_ref,
          vehicle_type,
          propulsion_type ?? 'electric'
        );
        setHistoryData(fresh ? fresh.sort((a, b) => a.effective_date.localeCompare(b.effective_date)) : []);
        onRecordUpdated();
      } else {
        alert('Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert(error instanceof Error ? error.message : 'Fout bij verwijderen');
    } finally {
      setTestActionLoading(null);
    }
  }, [token, historyData, municipality, provider_system_id, vehicle_type, propulsion_type, onRecordUpdated]);

  const handleTestInsert = useCallback(async (date: string) => {
    if (!token || !kpiListForTest?.length) {
      alert('KPI list niet beschikbaar.');
      return;
    }
    setTestActionLoading(`insert-${date}`);
    try {
      const geometry_ref = toGeometryRef(municipality);
      const history = await getGeometryOperatorModalityLimitHistory(
        token,
        provider_system_id,
        geometry_ref,
        vehicle_type,
        propulsion_type ?? 'electric'
      );
      const limits: Record<string, number> = {};
      kpiListForTest.forEach((kpi) => {
        limits[kpi.kpi_key] = randomKpiValue();
      });
      const ctx = getTestContext();
      const ops = planSetFullRecordAtDate(history ?? null, date, limits, ctx);
      await runPlannedOps(ops);
      const fresh = await getGeometryOperatorModalityLimitHistory(
        token,
        provider_system_id,
        geometry_ref,
        vehicle_type,
        propulsion_type ?? 'electric'
      );
      setHistoryData(fresh ? fresh.sort((a, b) => a.effective_date.localeCompare(b.effective_date)) : []);
      onRecordUpdated();
    } catch (error) {
      console.error('Test insert error:', error);
      alert('Fout bij insert');
    } finally {
      setTestActionLoading(null);
    }
  }, [token, kpiListForTest, municipality, provider_system_id, vehicle_type, propulsion_type, getTestContext, runPlannedOps, onRecordUpdated]);

  const handleTestRandom = useCallback(async (date: string) => {
    if (!token || !kpiListForTest?.length) {
      alert('KPI list niet beschikbaar.');
      return;
    }
    setTestActionLoading(`random-${date}`);
    try {
      const geometry_ref = toGeometryRef(municipality);
      const history = await getGeometryOperatorModalityLimitHistory(
        token,
        provider_system_id,
        geometry_ref,
        vehicle_type,
        propulsion_type ?? 'electric'
      );
      const found = findRecordContainingDate(history ?? null, date);
      const baseLimits: Record<string, number> = found ? { ...found.record.limits } : {};
      const kpiKeys = kpiListForTest.map((k) => k.kpi_key);
      const inRecord = Object.keys(baseLimits);
      const notInRecord = kpiKeys.filter((k) => !(k in baseLimits));
      const MIN_LIMITS = 5;
      const maxToReset = Math.max(0, inRecord.length - MIN_LIMITS);
      const toReset = pickRandomSubset(inRecord).slice(0, maxToReset);
      const toUpdate = pickRandomSubset(inRecord.filter((k) => !toReset.includes(k)));
      const toAdd = pickRandomSubset(notInRecord);
      toReset.forEach((k) => delete baseLimits[k]);
      toUpdate.forEach((k) => { baseLimits[k] = randomKpiValue(); });
      toAdd.forEach((k) => { baseLimits[k] = randomKpiValue(); });
      let stillNeed = MIN_LIMITS - Object.keys(baseLimits).length;
      if (stillNeed > 0) {
        const pool = kpiKeys.filter((k) => !(k in baseLimits));
        pickRandomSubset(pool, Math.min(stillNeed, pool.length), pool.length).forEach((k) => { baseLimits[k] = randomKpiValue(); });
      }
      const ctx = getTestContext();
      const ops = planSetFullRecordAtDate(history ?? null, date, baseLimits, ctx);
      await runPlannedOps(ops);
      const fresh = await getGeometryOperatorModalityLimitHistory(
        token,
        provider_system_id,
        geometry_ref,
        vehicle_type,
        propulsion_type ?? 'electric'
      );
      setHistoryData(fresh ? fresh.sort((a, b) => a.effective_date.localeCompare(b.effective_date)) : []);
      onRecordUpdated();
    } catch (error) {
      console.error('Test random error:', error);
      alert('Fout bij random');
    } finally {
      setTestActionLoading(null);
    }
  }, [token, kpiListForTest, municipality, provider_system_id, vehicle_type, propulsion_type, getTestContext, runPlannedOps, onRecordUpdated]);

  const handleEditorSave = async (data: GeometryOperatorModalityLimit) => {
    if (!token) return;
    const allowChange = mode === 'admin';
    if (!allowChange && data.effective_date < moment().format('YYYY-MM-DD')) {
      alert('Alleen toekomstige datums kunnen worden gewijzigd.');
      return;
    }
    try {
      const result = data.geometry_operator_modality_limit_id
        ? await updateGeometryOperatorModalityLimit(token, data, allowChange)
        : await addGeometryOperatorModalityLimit(token, data, allowChange);
      if (result) {
        onRecordUpdated();
      } else {
        alert('Fout bij opslaan');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Fout bij opslaan';
      alert(msg);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      title="Bewerk vergunningseisen"
      button1Title=""
      button1Handler={() => {}}
      button2Title="Sluiten"
      button2Handler={onClose}
      hideModalHandler={onClose}
      config={{ maxWidth: '98%', minWidth: '800px' }}
    >
      <div className="flex flex-col gap-4 min-h-[600px] relative">
        {/* Provider and vehicle type side by side */}
        <div className="flex flex-row justify-center items-start gap-12 mb-2">
          {/* Provider column */}
          <div className="flex flex-col items-center">
            <div className="min-h-[64px] flex items-center justify-center">
              <img 
                src={providerLogo} 
                alt={providerName} 
                className={`w-16 h-16 object-contain mb-1 ${onProviderClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={onProviderClick}
                onError={(e) => {
                  e.currentTarget.src = createSvgPlaceholder({
                    width: 48,
                    height: 48,
                    text: providerName.slice(0, 2),
                    bgColor: '#0F1C3F',
                    textColor: '#7FDBFF',
                    fontSize: 24,
                    fontWeight: 'bold',
                    fontFamily: 'Arial, sans-serif',
                    dy: 7,
                    radius: 4,
                  });
                }}
              />
            </div>
            <div className="text-center text-base font-medium text-gray-800 mt-1">{providerName}</div>
          </div>
          {/* Vehicle type column */}
          <div className="flex flex-col items-center">
            <div className="min-h-[64px] flex items-center justify-center">
              {vehicleTypeLogo && (
                <img 
                  src={vehicleTypeLogo} 
                  alt={vehicleTypeName} 
                  className={`w-16 h-16 object-contain mb-1 ${onVehicleTypeClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={onVehicleTypeClick}
                />
              )}
            </div>
            <div className="text-center text-base font-medium text-gray-800 mt-1">{vehicleTypeName}</div>
          </div>
        </div>

        {/* Link to dashboard */}
        <div className="text-sm text-gray-600 mb-4">
          Bekijk actuele prestaties op het{' '}
          <Link 
            to={`/dashboard/prestaties-aanbieders?gm_code=${municipality}&operator=${provider_system_id}&form_factor=${vehicle_type}`}
            className="text-blue-600 hover:underline"
          >
            Prestaties aanbieders
          </Link>
          {' '}dashboard.
        </div>

        {/* Main / Test tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 mb-4">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                activeTab === 'main'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoer
            </button>
          <button
            type="button"
            onClick={() => setActiveTab('kpilist')}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
              activeTab === 'kpilist'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KPI definities
          </button>
          {showTestTab && (
            <button
              type="button"
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
                activeTab === 'test'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test
            </button>
          )}
          </div>
          {activeTab === 'main' && (
            <button
              type="button"
              onClick={handleTitleClick}
              className="ml-auto p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title={useEditorMode ? 'Inline modus' : 'Formulier modus'}
            >
              {useEditorMode ? <Table2 size={20} /> : <FormInput size={20} />}
            </button>
          )}
        </div>

        {activeTab === 'main' && (
          <>
            {useEditorMode ? (
              <PermitLimitsEditor
                token={token}
                municipality={municipality}
                provider_system_id={provider_system_id}
                vehicle_type={vehicle_type}
                propulsion_type={propulsion_type}
                mode={mode}
                kpiDescriptions={kpiDescriptions}
                limitHistory={limitHistory}
                allowChange={mode === 'admin'}
                defaultDate={formModeDefaultDate}
                hideCancel
                onSave={handleEditorSave}
                onCancel={handleEditorCancel}
                onRecordUpdated={onRecordUpdated}
              />
            ) : (
              <>
                {showEditor && (
                  <PermitLimitsEditor
                    token={token}
                    municipality={municipality}
                    provider_system_id={provider_system_id}
                    vehicle_type={vehicle_type}
                    propulsion_type={propulsion_type}
                    mode={mode}
                    kpiDescriptions={kpiDescriptions}
                    limitHistory={limitHistory}
                    allowChange={mode === 'admin'}
                    focusDate={focusDate}
                    onFocusDateConsumed={() => setFocusDate(null)}
                    onSave={handleEditorSave}
                    onCancel={handleEditorCancel}
                    onRecordUpdated={onRecordUpdated}
                  />
                )}
                <PermitLimitsTable
                  tableRows={tableRows}
                  limitHistory={limitHistory}
                  kpiDescriptions={kpiDescriptions}
                  mode={mode}
                  token={token}
                  municipality={municipality}
                  provider_system_id={provider_system_id}
                  vehicle_type={vehicle_type}
                  propulsion_type={propulsion_type}
                  showPermitLimitsEditor={false}
                  onAddNew={handleAddNew}
                  onEditRow={handleEditRow}
                  onRecordUpdated={onRecordUpdated}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'test' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={handleTestReset}
                disabled={!!testActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="Verwijder alle records voor deze context"
              >
                {testActionLoading === 'reset' ? 'Bezig…' : 'Alles wissen'}
              </button>
              <span className="text-gray-500 text-sm mx-1">|</span>
              <button
                type="button"
                onClick={() => setTestViewMode('table')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${testViewMode === 'table' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Tabel
              </button>
              <button
                type="button"
                onClick={() => setTestViewMode('graph')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${testViewMode === 'graph' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Grafiek
              </button>
            </div>
            <div className="border border-gray-200 rounded p-3 bg-gray-50">
              <div className="text-sm font-semibold text-gray-700 mb-2">voeg / wijzig limieten op datum X</div>
              {historyLoading && historyData === null ? (
                <div className="py-4 text-center text-gray-500">Laden…</div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {TEST_DATES.map((d) => (
                        <th key={d} className="px-2 py-2 font-mono text-xs font-semibold border border-gray-300">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {TEST_DATES.map((d) => {
                        const relatedRecordExists = historyData?.some((r) => r.effective_date === d) ?? false;
                        return (
                          <td key={d} className="px-2 py-1.5 border border-gray-300">
                            {relatedRecordExists ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTestRandom(d)}
                                  disabled={!!testActionLoading || !kpiListForTest?.length}
                                  className="flex-1 px-2 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                                >
                                  {testActionLoading === `random-${d}` ? '…' : 'Random'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTestDelete(d)}
                                  disabled={!!testActionLoading}
                                  className="flex-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                                  title="Verwijder record; vorige record wordt verlengd tot end_date"
                                >
                                  {testActionLoading === `delete-${d}` ? '…' : 'Delete'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTestInsert(d)}
                                disabled={!!testActionLoading || !kpiListForTest?.length}
                                className="w-full px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                              >
                                {testActionLoading === `insert-${d}` ? '…' : 'Insert'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {historyData !== null && (
              <>
                {testViewMode === 'graph' ? (
                  <div className="border border-gray-200 rounded overflow-hidden bg-white">
                    {testChartData.length === 0 || testChartKpiKeys.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">Geen limiet-data om te tonen in grafiek.</div>
                    ) : (
                      <div className="w-full flex flex-row flex-wrap" style={{ minHeight: 320 }}>
                        <ResponsiveContainer width="75%" height={320}>
                          <LineChart
                            data={testChartData}
                            margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="x"
                              type="number"
                              domain={['dataMin', X_AXIS_MAX]}
                              tickFormatter={(ts) => {
                                const d = new Date(ts);
                                return d.toISOString().slice(0, 10);
                              }}
                              tick={{ fontSize: 12, fill: '#666' }}
                              dy={8}
                            />
                            <YAxis
                              label={{ value: 'Waarde', angle: -90, position: 'insideLeft', fontSize: 12 }}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              labelFormatter={(ts) => `Datum: ${new Date(ts).toISOString().slice(0, 10)}`}
                              formatter={(value: number) => [value, '']}
                              contentStyle={{ fontSize: 12 }}
                            />
                            {testChartKpiKeys.map((kpiKey, idx) => (
                              <Line
                                key={kpiKey}
                                type="linear"
                                dataKey={kpiKey}
                                name={kpiListForTest?.find((k) => k.kpi_key === kpiKey)?.title ?? kpiKey}
                                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col justify-center ml-4 min-w-[140px]">
                          <div className="mb-2 font-semibold text-sm">Legenda</div>
                          <div className="flex flex-col gap-1.5 text-xs">
                            {testChartKpiKeys.map((kpiKey, idx) => (
                              <span key={kpiKey} className="flex items-center">
                                <span
                                  className="inline-block w-4 h-1 rounded mr-2 flex-shrink-0"
                                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                />
                                {kpiListForTest?.find((k) => k.kpi_key === kpiKey)?.title ?? kpiKey}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-semibold">id</th>
                          <th className="text-left px-3 py-2 font-semibold">operator</th>
                          <th className="text-left px-3 py-2 font-semibold">geometry_ref</th>
                          <th className="text-left px-3 py-2 font-semibold">form_factor</th>
                          <th className="text-left px-3 py-2 font-semibold">propulsion_type</th>
                          <th className="text-left px-3 py-2 font-semibold">effective_date</th>
                          <th className="text-left px-3 py-2 font-semibold">end_date</th>
                          <th className="text-left px-3 py-2 font-semibold">limits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                              Geen records gevonden
                            </td>
                          </tr>
                        ) : (
                          historyData.map((record, idx) => (
                            <tr key={record.geometry_operator_modality_limit_id ?? idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono text-xs">{record.geometry_operator_modality_limit_id ?? '-'}</td>
                              <td className="px-3 py-2">{record.operator}</td>
                              <td className="px-3 py-2">{record.geometry_ref}</td>
                              <td className="px-3 py-2">{record.form_factor}</td>
                              <td className="px-3 py-2">{record.propulsion_type}</td>
                              <td className="px-3 py-2">{record.effective_date}</td>
                              <td className="px-3 py-2">{record.end_date ?? '-'}</td>
                              <td className="px-3 py-2 font-mono text-xs whitespace-pre-wrap">{JSON.stringify(record.limits, null, 2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'kpilist' && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {kpiListForTest === null ? (
              <div className="px-4 py-8 text-center text-gray-500">Laden…</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">KPI</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Type grens</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Eenheid</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Beschrijving</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Definitie</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiListForTest.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        Geen KPIs gevonden
                      </td>
                    </tr>
                  ) : (
                    kpiListForTest.map((kpi) => (
                      <tr key={kpi.kpi_key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{kpi.title}</td>
                        <td className="px-4 py-3 text-gray-700">{formatBound(kpi.bound)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatUnit(kpi.unit)}</td>
                        <td className="px-4 py-3 text-gray-600">{kpi.bound_description || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{kpi.description || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditLimitsDialog;
