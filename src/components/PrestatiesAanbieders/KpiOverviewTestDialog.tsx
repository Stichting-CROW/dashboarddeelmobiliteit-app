import React, { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import Modal from '../Modal/Modal.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  getPermitLimitOverviewForMunicipality,
  getGeometryOperatorModalityLimitHistory,
  getAllGeometryOperatorModalityLimitsForMunicipality,
  addGeometryOperatorModalityLimit,
  updateGeometryOperatorModalityLimit,
  deleteGeometryOperatorModalityLimit,
  toGeometryRef,
} from '../../api/permitLimits';
import {
  findRecordContainingDate,
  planSetFullRecordAtDate,
  planSetKpiAtDate,
  randomKpiValue,
} from './permitLimitsOperations';
import type { GeometryOperatorModalityLimit } from '../../api/permitLimits';

const MDS_BASE_URL = 'https://mds.dashboarddeelmobiliteit.nl';

interface KpiOverviewTestDialogProps {
  isVisible: boolean;
  onClose: () => void;
  token: string | null;
  municipality: string;
}

const fetchKpiOverview = async (
  token: string,
  params: {
    start_date: string;
    end_date: string;
    municipality: string;
    system_id?: string;
    form_factor?: string;
    propulsion_type?: string;
  }
): Promise<unknown> => {
  const searchParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
    municipality: params.municipality,
  });
  if (params.system_id) searchParams.append('system_id', params.system_id);
  if (params.form_factor) searchParams.append('form_factor', params.form_factor);
  if (params.propulsion_type) searchParams.append('propulsion_type', params.propulsion_type);
  const url = `${MDS_BASE_URL}/kpi_overview_operators?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const text = await response.text();
  if (response.status !== 200 && response.status !== 500) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

/** Default effective_date for new limit records */
const NEW_LIMIT_EFFECTIVE_DATE = '2026-01-01';

interface OverviewRow {
  operator: string;
  geometry_ref: string;
  form_factor: string;
  propulsion_type: string;
  kpi_key: string;
  granularity: string;
  numRecords: number;
  numDataValues: number;
  numLimitValues: number;
  hasLimit: boolean;
  limitValue: number | null;
}

function limitKey(op: string, geom: string, ff: string, pt: string): string {
  return `${op}|${geom}|${ff}|${pt}`;
}

interface LimitHistoryEntry {
  operator: string;
  geometry_ref: string;
  form_factor: string;
  propulsion_type: string;
  history: GeometryOperatorModalityLimit[];
  currentRecord: GeometryOperatorModalityLimit | null;
}

function formatActiveLimitRecord(record: GeometryOperatorModalityLimit | null): string {
  if (!record) return 'Geen actief limit record';
  return JSON.stringify(record, null, 2);
}

const OverviewTabContent: React.FC<{
  obj: Record<string, unknown>;
  limitMap: Map<string, Record<string, number>>;
  municipality: string;
  kpiKeyFilter?: string;
}> = ({ obj, limitMap, municipality, kpiKeyFilter = '' }) => {
  const pid = obj.performance_indicator_description;
  const pidCount = Array.isArray(pid) ? pid.length : 0;

  const operators = obj.municipality_modality_operators;
  const rows: OverviewRow[] = [];
  if (Array.isArray(operators)) {
    for (const op of operators) {
      const o = op as { operator: string; form_factor: string; propulsion_type: string; geometry_ref?: string; kpis?: unknown[] };
      const geometryRef = o.geometry_ref || toGeometryRef(municipality);
      const kpis = o.kpis || [];
      for (const kpi of kpis) {
        const k = kpi as { kpi_key: string; granularity?: string; values?: unknown[] };
        const values = Array.isArray(k.values) ? k.values : [];
        const numDataValues = values.filter((v: unknown) => v !== null && typeof v === 'object' && 'measured' in (v as object)).length;
        const numLimitValues = values.filter((v: unknown) => {
          if (v === null || typeof v !== 'object') return false;
          const o2 = v as Record<string, unknown>;
          return o2.threshold !== undefined || o2.complies !== undefined;
        }).length;
        const limits = limitMap.get(limitKey(o.operator, geometryRef, o.form_factor, o.propulsion_type));
        const limitVal = limits && k.kpi_key in limits ? limits[k.kpi_key] : null;
        rows.push({
          operator: o.operator,
          geometry_ref: geometryRef,
          form_factor: o.form_factor,
          propulsion_type: o.propulsion_type,
          kpi_key: k.kpi_key,
          granularity: (k.granularity as string) || '',
          numRecords: values.length,
          numDataValues,
          numLimitValues,
          hasLimit: limitVal !== null,
          limitValue: limitVal ?? null,
        });
      }
    }
  }

  const filteredRows = kpiKeyFilter ? rows.filter((r) => r.kpi_key === kpiKeyFilter) : rows;

  return (
    <div className="space-y-4">
      <table className="w-full text-sm border-collapse border border-gray-300">
        <tbody>
          <tr>
            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-100">performance_indicator_description</td>
            <td className="border border-gray-300 px-3 py-2">number of records</td>
            <td className="border border-gray-300 px-3 py-2">{pidCount}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-100">municipality_modality_operators</td>
            <td className="border border-gray-300 px-3 py-2" colSpan={2}>
              {filteredRows.length} combination(s) – see table below
            </td>
          </tr>
        </tbody>
      </table>

      {filteredRows.length > 0 && (
        <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">operator</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">form_factor</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">propulsion_type</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">kpi_key</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">granularity</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right bg-gray-100">num records</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right bg-gray-100">num data values</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right bg-gray-100">num limit values</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center bg-gray-100">has limit</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right bg-gray-100">limit value</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => {
                let cellBg = '';
                if (r.hasLimit) {
                  cellBg = r.numDataValues === r.numLimitValues ? 'bg-green-100' : 'bg-yellow-100';
                } else if (r.numLimitValues > 0) {
                  cellBg = 'bg-red-100';
                }
                return (
                  <tr key={i}>
                    <td className="border border-gray-300 px-2 py-1">{r.operator}</td>
                    <td className="border border-gray-300 px-2 py-1">{r.form_factor}</td>
                    <td className="border border-gray-300 px-2 py-1">{r.propulsion_type}</td>
                    <td className="border border-gray-300 px-2 py-1">{r.kpi_key}</td>
                    <td className="border border-gray-300 px-2 py-1">{r.granularity}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{r.numRecords}</td>
                    <td className={`border border-gray-300 px-2 py-1 text-right ${cellBg}`}>{r.numDataValues}</td>
                    <td className={`border border-gray-300 px-2 py-1 text-right ${cellBg}`}>{r.numLimitValues}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{r.hasLimit ? '✓' : '—'}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{r.limitValue !== null ? String(r.limitValue) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const KpiLimitsTabContent: React.FC<{
  limitData: LimitHistoryEntry[];
  kpiKeys: string[];
  token: string | null;
  onRefreshLimitData: () => Promise<void>;
}> = ({ limitData, kpiKeys, token, onRefreshLimitData }) => {
  const [loadingRowKey, setLoadingRowKey] = useState<string | null>(null);
  const [loadingCellKey, setLoadingCellKey] = useState<string | null>(null);
  const [loadingColumnKey, setLoadingColumnKey] = useState<string | null>(null);

  const handleKpiColumnClick = async (kpiKey: string) => {
    if (!token) return;
    const anyHasValue = limitData.some(
      (e) => e.currentRecord?.limits && kpiKey in (e.currentRecord.limits ?? {})
    );
    setLoadingColumnKey(`kpi:${kpiKey}`);
    try {
      const date = NEW_LIMIT_EFFECTIVE_DATE;
      for (const entry of limitData) {
        const ctx = {
          operator: entry.operator,
          geometry_ref: entry.geometry_ref,
          form_factor: entry.form_factor,
          propulsion_type: entry.propulsion_type,
        };
        if (anyHasValue) {
          const hasThisKpi = entry.currentRecord?.limits && kpiKey in (entry.currentRecord.limits ?? {});
          if (!hasThisKpi) continue;
          const ops = planSetKpiAtDate(entry.history, date, kpiKey, 'absent', ctx);
          for (const op of ops) {
            if (op.type === 'PUT' && op.record.geometry_operator_modality_limit_id) {
              await updateGeometryOperatorModalityLimit(token, op.record, true);
            } else if (op.type === 'POST') {
              await addGeometryOperatorModalityLimit(token, op.record, true);
            }
          }
        } else {
          if (entry.currentRecord) {
            const ops = planSetKpiAtDate(entry.history, date, kpiKey, randomKpiValue(), ctx);
            for (const op of ops) {
              if (op.type === 'PUT' && op.record.geometry_operator_modality_limit_id) {
                await updateGeometryOperatorModalityLimit(token, op.record, true);
              } else if (op.type === 'POST') {
                await addGeometryOperatorModalityLimit(token, op.record, true);
              }
            }
          }
        }
      }
      await onRefreshLimitData();
    } catch (err) {
      console.error('KPI column toggle error:', err);
      alert(err instanceof Error ? err.message : 'Fout bij wijzigen');
    } finally {
      setLoadingColumnKey(null);
    }
  };

  const handleOnOffColumnClick = async () => {
    if (!token) return;
    const anyHasLimits = limitData.some(
      (e) => e.currentRecord && Object.keys(e.currentRecord.limits ?? {}).length > 0
    );
    setLoadingColumnKey('onoff');
    try {
      if (anyHasLimits) {
        for (const entry of limitData) {
          for (const record of entry.history) {
            if (record.geometry_operator_modality_limit_id) {
              await deleteGeometryOperatorModalityLimit(token, record.geometry_operator_modality_limit_id);
            }
          }
        }
      } else if (kpiKeys.length > 0) {
        const date = NEW_LIMIT_EFFECTIVE_DATE;
        for (const entry of limitData) {
          const limits: Record<string, number> = {};
          kpiKeys.forEach((k) => { limits[k] = randomKpiValue(); });
          const ctx = {
            operator: entry.operator,
            geometry_ref: entry.geometry_ref,
            form_factor: entry.form_factor,
            propulsion_type: entry.propulsion_type,
          };
          const ops = planSetFullRecordAtDate(entry.history, date, limits, ctx);
          for (const op of ops) {
            if (op.type === 'PUT' && op.record.geometry_operator_modality_limit_id) {
              await updateGeometryOperatorModalityLimit(token, op.record, true);
            } else if (op.type === 'POST') {
              await addGeometryOperatorModalityLimit(token, op.record, true);
            }
          }
        }
      } else {
        alert('Geen KPI keys beschikbaar. Roep eerst de API aan.');
      }
      await onRefreshLimitData();
    } catch (err) {
      console.error('On/off column error:', err);
      alert(err instanceof Error ? err.message : 'Fout bij wijzigen');
    } finally {
      setLoadingColumnKey(null);
    }
  };

  const handleKpiCellClick = async (entry: LimitHistoryEntry, kpiKey: string) => {
    if (!token) return;
    const rowKey = limitKey(entry.operator, entry.geometry_ref, entry.form_factor, entry.propulsion_type);
    const cellKey = `${rowKey}|${kpiKey}`;
    setLoadingCellKey(cellKey);
    try {
      const ctx = {
        operator: entry.operator,
        geometry_ref: entry.geometry_ref,
        form_factor: entry.form_factor,
        propulsion_type: entry.propulsion_type,
      };
      const date = NEW_LIMIT_EFFECTIVE_DATE;
      const hasValue = entry.currentRecord?.limits && kpiKey in entry.currentRecord.limits;
      const value = hasValue ? ('absent' as const) : randomKpiValue();
      const ops = planSetKpiAtDate(entry.history, date, kpiKey, value, ctx);
      for (const op of ops) {
        if (op.type === 'PUT' && op.record.geometry_operator_modality_limit_id) {
          await updateGeometryOperatorModalityLimit(token, op.record, true);
        } else if (op.type === 'POST') {
          await addGeometryOperatorModalityLimit(token, op.record, true);
        }
      }
      await onRefreshLimitData();
    } catch (err) {
      console.error('KPI cell toggle error:', err);
      alert(err instanceof Error ? err.message : 'Fout bij wijzigen');
    } finally {
      setLoadingCellKey(null);
    }
  };

  const handleOn = async (entry: LimitHistoryEntry) => {
    if (!token || kpiKeys.length === 0) {
      if (kpiKeys.length === 0) alert('Geen KPI keys beschikbaar. Roep eerst de API aan.');
      return;
    }
    const key = limitKey(entry.operator, entry.geometry_ref, entry.form_factor, entry.propulsion_type);
    setLoadingRowKey(key);
    try {
      const limits: Record<string, number> = {};
      kpiKeys.forEach((k) => { limits[k] = randomKpiValue(); });
      const ctx = {
        operator: entry.operator,
        geometry_ref: entry.geometry_ref,
        form_factor: entry.form_factor,
        propulsion_type: entry.propulsion_type,
      };
      const date = NEW_LIMIT_EFFECTIVE_DATE;
      const ops = planSetFullRecordAtDate(entry.history, date, limits, ctx);
      for (const op of ops) {
        if (op.type === 'PUT' && op.record.geometry_operator_modality_limit_id) {
          await updateGeometryOperatorModalityLimit(token, op.record, true);
        } else if (op.type === 'POST') {
          await addGeometryOperatorModalityLimit(token, op.record, true);
        }
      }
      await onRefreshLimitData();
    } catch (err) {
      console.error('Add limits error:', err);
      alert(err instanceof Error ? err.message : 'Fout bij toevoegen');
    } finally {
      setLoadingRowKey(null);
    }
  };

  const handleOff = async (entry: LimitHistoryEntry) => {
    if (!token) return;
    const key = limitKey(entry.operator, entry.geometry_ref, entry.form_factor, entry.propulsion_type);
    setLoadingRowKey(key);
    try {
      for (const record of entry.history) {
        if (record.geometry_operator_modality_limit_id) {
          await deleteGeometryOperatorModalityLimit(token, record.geometry_operator_modality_limit_id);
        }
      }
      await onRefreshLimitData();
    } catch (err) {
      console.error('Delete limits error:', err);
      alert(err instanceof Error ? err.message : 'Fout bij verwijderen');
    } finally {
      setLoadingRowKey(null);
    }
  };

  if (limitData.length === 0) {
    return <div className="text-sm text-gray-600">Geen limit data beschikbaar.</div>;
  }
  const kpiKeysFromData = Array.from(
    new Set(limitData.flatMap((e) => Object.keys(e.currentRecord?.limits ?? {})))
  ).sort();
  const allKpiKeys = kpiKeys.length > 0 ? kpiKeys : kpiKeysFromData;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto overflow-y-auto max-h-[50vh]">
        <table className="w-full text-xs border-collapse border border-gray-300">
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">operator</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">geometry_ref</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">form_factor</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left bg-gray-100">propulsion_type</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center bg-gray-100">
                <button
                  type="button"
                  onClick={handleOnOffColumnClick}
                  disabled={loadingColumnKey === 'onoff'}
                  className="w-full px-2 py-1 text-xs font-medium rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingColumnKey === 'onoff' ? '…' : 'on/off'}
                </button>
              </th>
              {allKpiKeys.map((k, i) => (
                <th key={k} className="border border-gray-300 px-2 py-1.5 text-right bg-gray-100">
                  <button
                    type="button"
                    onClick={() => handleKpiColumnClick(k)}
                    disabled={loadingColumnKey === `kpi:${k}`}
                    className="w-full px-2 py-1 text-xs font-medium rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {loadingColumnKey === `kpi:${k}` ? '…' : `kpi${i + 1}`}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {limitData.map((entry, idx) => {
              const rowKey = limitKey(entry.operator, entry.geometry_ref, entry.form_factor, entry.propulsion_type);
              const hasLimits = entry.currentRecord && Object.keys(entry.currentRecord.limits ?? {}).length > 0;
              const isLoading = loadingRowKey === rowKey;
              return (
                <tr key={idx}>
                  <td className="border border-gray-300 px-2 py-1">{entry.operator}</td>
                  <td className="border border-gray-300 px-2 py-1">{entry.geometry_ref}</td>
                  <td className="border border-gray-300 px-2 py-1">{entry.form_factor}</td>
                  <td className="border border-gray-300 px-2 py-1">{entry.propulsion_type}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {hasLimits ? (
                      <button
                        type="button"
                        onClick={() => handleOff(entry)}
                        disabled={isLoading}
                        className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                      >
                        {isLoading ? '…' : 'on'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOn(entry)}
                        disabled={isLoading}
                        className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {isLoading ? '…' : 'off'}
                      </button>
                    )}
                  </td>
                  {allKpiKeys.map((k) => {
                    const cellKey = `${rowKey}|${k}`;
                    const cellLoading = loadingCellKey === cellKey;
                    const hasRecord = !!entry.currentRecord;
                    const val = entry.currentRecord?.limits && k in entry.currentRecord.limits
                      ? entry.currentRecord.limits[k]
                      : null;
                    const hasValue = val !== null;
                    return (
                      <td key={k} className="border border-gray-300 px-2 py-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasRecord ? (
                            <button
                              type="button"
                              onClick={() => handleKpiCellClick(entry, k)}
                              disabled={cellLoading}
                              className={`min-w-[2rem] px-1 py-0.5 text-xs rounded disabled:opacity-50 disabled:cursor-wait ${
                                hasValue ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              {cellLoading ? '…' : val !== null ? val : '—'}
                            </button>
                          ) : (
                            <span>—</span>
                          )}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-help text-gray-500 hover:text-gray-700">
                                  <Info className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-md max-h-[50vh] overflow-auto text-left">
                                <pre className="text-xs font-mono whitespace-pre-wrap text-left">
                                  {formatActiveLimitRecord(entry.currentRecord)}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-600 border border-gray-200 rounded p-3 bg-gray-50">
        <div className="font-semibold mb-1">Legend</div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {allKpiKeys.map((k, i) => (
            <span key={k}>
              <strong>kpi{i + 1}</strong> = {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const KpiOverviewTestDialog: React.FC<KpiOverviewTestDialogProps> = ({
  isVisible,
  onClose,
  token,
  municipality,
}) => {
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-07');
  const [systemId, setSystemId] = useState<string>('');
  const [formFactor, setFormFactor] = useState<string>('');
  const [propulsionType, setPropulsionType] = useState<string>('');
  const [kpiKeyFilter, setKpiKeyFilter] = useState<string>('');
  const [options, setOptions] = useState<{
    systemIds: string[];
    formFactors: string[];
    propulsionTypes: string[];
  }>({ systemIds: [], formFactors: [], propulsionTypes: [] });
  const [data, setData] = useState<unknown | null>(null);
  const [limitData, setLimitData] = useState<LimitHistoryEntry[]>([]);
  const [limitMap, setLimitMap] = useState<Map<string, Record<string, number>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [kpiRawData, setKpiRawData] = useState<unknown>(null);
  const [kpiRawLoading, setKpiRawLoading] = useState(false);
  const [kpiRawError, setKpiRawError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    if (!token || !municipality) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchKpiOverview(token, {
        start_date: startDate,
        end_date: endDate,
        municipality,
        ...(systemId && { system_id: systemId }),
        ...(formFactor && { form_factor: formFactor }),
        ...(propulsionType && { propulsion_type: propulsionType }),
      });
      setData(result);

      const obj = result && typeof result === 'object' ? (result as Record<string, unknown>) : null;
      const operators = obj?.municipality_modality_operators;
      const today = toDateStr(new Date());
      const geometryRefBase = toGeometryRef(municipality);

      const seen = new Set<string>();
      const entries: LimitHistoryEntry[] = [];
      const map = new Map<string, Record<string, number>>();

      if (Array.isArray(operators)) {
        for (const op of operators) {
          const o = op as { operator: string; form_factor: string; propulsion_type: string; geometry_ref?: string };
          const geometryRef = o.geometry_ref || geometryRefBase;
          const key = limitKey(o.operator, geometryRef, o.form_factor, o.propulsion_type);
          if (seen.has(key)) continue;
          seen.add(key);

          const history = await getGeometryOperatorModalityLimitHistory(
            token,
            o.operator,
            geometryRef,
            o.form_factor,
            o.propulsion_type
          );
          const found = history ? findRecordContainingDate(history, today) : null;
          const currentRecord = found?.record ?? null;
          const limits = currentRecord?.limits ?? {};

          map.set(key, limits);
          entries.push({
            operator: o.operator,
            geometry_ref: geometryRef,
            form_factor: o.form_factor,
            propulsion_type: o.propulsion_type,
            history: history ?? [],
            currentRecord,
          });
        }
      }

      setLimitMap(map);
      setLimitData(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [token, municipality, startDate, endDate, systemId, formFactor, propulsionType]);

  useEffect(() => {
    if (!isVisible || !token || !municipality) return;
    handleFetch();
  }, [isVisible, token, municipality, startDate, endDate, systemId, formFactor, propulsionType, handleFetch]);

  const handleFetchKpiRaw = useCallback(async () => {
    if (!token || !municipality) return;
    setKpiRawLoading(true);
    setKpiRawError(null);
    try {
      const records = await getAllGeometryOperatorModalityLimitsForMunicipality(token, municipality);
      setKpiRawData(records);
    } catch (err) {
      setKpiRawError(err instanceof Error ? err.message : String(err));
    } finally {
      setKpiRawLoading(false);
    }
  }, [token, municipality]);

  useEffect(() => {
    if (activeTab === 'kpi raw' && isVisible && token && municipality) {
      handleFetchKpiRaw();
    }
  }, [activeTab, isVisible, token, municipality, handleFetchKpiRaw]);

  useEffect(() => {
    if (!isVisible || !token || !municipality) return;
    const loadOptions = async () => {
      const results = await getPermitLimitOverviewForMunicipality(token, municipality);
      if (!results) return;
      const systemIds = Array.from(new Set(results.map((r) => r.permit_limit?.system_id).filter(Boolean))) as string[];
      const formFactors = Array.from(new Set(results.map((r) => r.vehicle_type?.id || r.permit_limit?.modality).filter(Boolean))) as string[];
      const propulsionTypes = Array.from(new Set(results.map((r) => r.propulsion_type).filter(Boolean))) as string[];
      setOptions({ systemIds, formFactors, propulsionTypes });
    };
    loadOptions();
  }, [isVisible, token, municipality]);

  const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const tabs = ['overview', 'kpi limits', 'raw', 'kpi raw'];
  const isOverviewTab = activeTab === 'overview';
  const isKpiLimitsTab = activeTab === 'kpi limits';
  const isRawTab = activeTab === 'raw';
  const isKpiRawTab = activeTab === 'kpi raw';

  const kpiKeysFromPid = Array.isArray(obj?.performance_indicator_description)
    ? (obj.performance_indicator_description as { kpi_key: string }[]).map((x) => x.kpi_key)
    : [];

  return (
    <Modal
      isVisible={isVisible}
      title="KPI overview test"
      button2Title="Sluiten"
      button2Handler={onClose}
      hideModalHandler={onClose}
      config={{ width: '66.666vw', maxWidth: '66.666vw', minWidth: '66.666vw', noBodyScroll: true }}
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        <div className="text-sm text-gray-600 flex-shrink-0">
          Municipality: <strong>{municipality || '(geen geselecteerd)'}</strong>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-shrink-0">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">start_date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">end_date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">system_id (optioneel)</label>
            <select
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">— weglaten —</option>
              {options.systemIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">form_factor (optioneel)</label>
            <select
              value={formFactor}
              onChange={(e) => setFormFactor(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">— weglaten —</option>
              {options.formFactors.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">propulsion_type (optioneel)</label>
            <select
              value={propulsionType}
              onChange={(e) => setPropulsionType(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">— weglaten —</option>
              {options.propulsionTypes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {!data && (
          <div className="flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={handleFetch}
              disabled={!token || !municipality || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Laden…' : 'Verversen'}
            </button>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 rounded flex-shrink-0">{error}</div>
        )}

        {data && obj && (
          <div className="border border-gray-200 rounded overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0 items-center justify-between">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {!isKpiLimitsTab && (
                <div className="flex items-center gap-2 mx-2 my-1">
                  {!isKpiRawTab && (
                    <>
                      <label className="text-xs font-medium text-gray-600 whitespace-nowrap">kpi_key</label>
                      <select
                        value={kpiKeyFilter}
                        onChange={(e) => setKpiKeyFilter(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">— alle —</option>
                        {kpiKeysFromPid.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={isKpiRawTab ? handleFetchKpiRaw : handleFetch}
                    disabled={!token || !municipality || (isKpiRawTab ? kpiRawLoading : loading)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {(isKpiRawTab ? kpiRawLoading : loading) ? 'Laden…' : 'Verversen'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 flex-1 min-h-0 overflow-auto">
              {isOverviewTab ? (
                <OverviewTabContent obj={obj} limitMap={limitMap} municipality={municipality} kpiKeyFilter={kpiKeyFilter} />
              ) : isKpiLimitsTab ? (
                <KpiLimitsTabContent
                  limitData={limitData}
                  kpiKeys={kpiKeysFromPid}
                  token={token}
                  onRefreshLimitData={handleFetch}
                />
              ) : isRawTab ? (
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-white p-4 rounded border border-gray-200">
                    {obj ? JSON.stringify(obj, null, 2) : ''}
                  </pre>
                </div>
              ) : isKpiRawTab ? (
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                  {kpiRawError && (
                    <div className="text-red-600 text-sm p-2 bg-red-50 rounded mb-2">{kpiRawError}</div>
                  )}
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-white p-4 rounded border border-gray-200 text-left">
                    {kpiRawLoading ? 'Laden…' : kpiRawData != null ? JSON.stringify(kpiRawData, null, 2) : ''}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KpiOverviewTestDialog;
