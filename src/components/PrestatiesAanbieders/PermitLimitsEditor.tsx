import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  GeometryOperatorModalityLimit,
  PerformanceIndicatorDescription,
} from '../../api/permitLimits';
import { toDateOnly, formatBound } from './permitLimitsUtils';

interface PermitLimitsEditorProps {
  token: string;
  municipality: string;
  provider_system_id: string;
  vehicle_type: string;
  propulsion_type?: string;
  mode: 'normal' | 'admin';
  kpiDescriptions: PerformanceIndicatorDescription[];
  limitHistory: GeometryOperatorModalityLimit[] | null;
  focusDate?: string | null;
  onFocusDateConsumed?: () => void;
  /** When true (admin), allow editing past dates; when false, only future */
  allowChange?: boolean;
  /** Initial date when no focusDate; defaults to today */
  defaultDate?: string;
  /** Hide cancel button (e.g. when form is always shown) */
  hideCancel?: boolean;
  /** Min date for date input; when not set, uses first record's effective_date or today */
  minDate?: string;
  onSave: (data: GeometryOperatorModalityLimit) => void | Promise<void>;
  onCancel: () => void;
  onRecordUpdated: () => void;
}

const isNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);

const PermitLimitsEditor: React.FC<PermitLimitsEditorProps> = ({
  municipality,
  provider_system_id,
  vehicle_type,
  propulsion_type = 'electric',
  mode,
  kpiDescriptions,
  limitHistory,
  focusDate,
  onFocusDateConsumed,
  allowChange = mode === 'admin',
  defaultDate,
  hideCancel,
  minDate,
  onSave,
  onCancel,
}) => {
  const today = moment().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate ?? focusDate ?? today);

  const firstRecordDate = useMemo(() => {
    if (!limitHistory || limitHistory.length === 0) return moment().format('YYYY-MM-DD');
    const sorted = [...limitHistory].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
    return toDateOnly(sorted[0].effective_date);
  }, [limitHistory]);

  useEffect(() => {
    if (focusDate) {
      setSelectedDate(focusDate);
      onFocusDateConsumed?.();
    }
  }, [focusDate, onFocusDateConsumed]);

  // Dynamic form state: { [kpiKey]: value } — empty value = inactive/disabled limit
  const [kpiValues, setKpiValues] = useState<Record<string, number | ''>>({});
  const [focusedKpiKey, setFocusedKpiKey] = useState<string | null>(null);

  const { currentRecord, currentRecordIndex, sortedHistory } = useMemo(() => {
    if (!limitHistory || limitHistory.length === 0) {
      return { currentRecord: null as GeometryOperatorModalityLimit | null, currentRecordIndex: -1, sortedHistory: [] as GeometryOperatorModalityLimit[] };
    }
    const sorted = [...limitHistory].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
    const sel = toDateOnly(selectedDate);
    for (let i = 0; i < sorted.length; i++) {
      const startdate = toDateOnly(sorted[i].effective_date);
      const nextStart = i < sorted.length - 1 ? toDateOnly(sorted[i + 1].effective_date) : '9999-12-31';
      if (sel >= startdate && (nextStart === '9999-12-31' ? sel <= nextStart : sel < nextStart)) {
        return { currentRecord: sorted[i], currentRecordIndex: i, sortedHistory: sorted };
      }
    }
    return { currentRecord: null, currentRecordIndex: -1, sortedHistory: sorted };
  }, [limitHistory, selectedDate]);

  const prevRecordDate = useMemo(() => {
    const sel = toDateOnly(selectedDate);
    const before = sortedHistory.filter((r) => toDateOnly(r.effective_date) < sel);
    return before.length > 0 ? toDateOnly(before[before.length - 1].effective_date) : null;
  }, [sortedHistory, selectedDate]);
  const nextRecordDate = useMemo(() => {
    const sel = toDateOnly(selectedDate);
    const after = sortedHistory.filter((r) => toDateOnly(r.effective_date) > sel);
    return after.length > 0 ? toDateOnly(after[0].effective_date) : null;
  }, [sortedHistory, selectedDate]);

  useEffect(() => {
    const next: Record<string, number | ''> = {};
    kpiDescriptions.forEach((kpi) => {
      const hasValue = currentRecord && currentRecord.limits[kpi.kpi_key] !== undefined;
      const val = hasValue ? currentRecord!.limits[kpi.kpi_key] : undefined;
      next[kpi.kpi_key] = typeof val === 'number' ? val : '';
    });
    setKpiValues(next);
  }, [currentRecord, kpiDescriptions]);

  const handleSelectedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const setKpiValue = (kpiKey: string, value: number | '') => {
    setKpiValues((prev) => ({
      ...prev,
      [kpiKey]: value,
    }));
  };

  const getNewData = (): GeometryOperatorModalityLimit => {
    const limits: Record<string, number> = currentRecord ? { ...currentRecord.limits } : {};
    kpiDescriptions.forEach((kpi) => {
      const val = kpiValues[kpi.kpi_key];
      if (val !== '' && val !== undefined) {
        limits[kpi.kpi_key] = val as number;
      } else {
        delete limits[kpi.kpi_key];
      }
    });

    const geometry_ref = municipality.startsWith('cbs:') ? municipality : `cbs:${municipality}`;

    const base: GeometryOperatorModalityLimit = {
      operator: provider_system_id,
      geometry_ref,
      form_factor: vehicle_type,
      propulsion_type,
      effective_date: toDateOnly(selectedDate),
      limits,
    };

    const isEditingExistingRecord =
      currentRecord?.geometry_operator_modality_limit_id &&
      toDateOnly(selectedDate) === toDateOnly(currentRecord.effective_date);
    if (isEditingExistingRecord && currentRecord) {
      base.geometry_operator_modality_limit_id = currentRecord.geometry_operator_modality_limit_id;
      if (currentRecord.end_date !== undefined) {
        base.end_date = currentRecord.end_date;
      }
    }

    return base;
  };

  const handleOk = () => {
    onSave(getNewData());
  };

  const isChanged = useMemo(() => {
    const newLimits: Record<string, number> = {};
    kpiDescriptions.forEach((kpi) => {
      const val = kpiValues[kpi.kpi_key];
      if (val !== '' && val !== undefined) {
        newLimits[kpi.kpi_key] = val as number;
      }
    });

    if (!currentRecord) {
      return Object.keys(newLimits).length > 0;
    }
    const isCreatingNewAtDifferentDate = toDateOnly(selectedDate) !== toDateOnly(currentRecord.effective_date);
    if (isCreatingNewAtDifferentDate && Object.keys(newLimits).length > 0) {
      return true;
    }
    const oldKeys = Object.keys(currentRecord.limits);
    const newKeys = Object.keys(newLimits);
    if (oldKeys.length !== newKeys.length) return true;
    for (const k of newKeys) {
      if (currentRecord.limits[k] !== newLimits[k]) return true;
    }
    return false;
  }, [currentRecord, kpiValues, kpiDescriptions, selectedDate]);

  const isValid = useMemo(() => {
    return kpiDescriptions.every((kpi) => {
      const val = kpiValues[kpi.kpi_key];
      if (val === '' || val === undefined) return true;
      return isNumber(val) && val >= 0;
    });
  }, [kpiDescriptions, kpiValues]);

  const dateMin = minDate ?? firstRecordDate;
  const canEdit = allowChange || toDateOnly(selectedDate) >= today;

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col items-center">
        {currentRecord ? (
          <span>
            {(() => {
              const effectiveEnd = currentRecord.end_date ??
                (currentRecordIndex < sortedHistory.length - 1 ? toDateOnly(sortedHistory[currentRecordIndex + 1].effective_date) : undefined);
              return effectiveEnd
                ? `Deze configuratie is actief van ${moment(currentRecord.effective_date).format('L')} tot ${moment(effectiveEnd).format('L')}`
                : `Deze configuratie is actief vanaf ${moment(currentRecord.effective_date).format('L')}`;
            })()}
          </span>
        ) : (
          <span>Geen configuratie actief</span>
        )}
      </div>

      <div className="permits-form-grid mb-2">
        <label htmlFor="start-date" className="permits-form-label">Ingangsdatum</label>
        <div className="permits-form-input-wrap">
          <input
            id="start-date"
            type="date"
            className="permits-form-input"
            value={selectedDate}
            min={dateMin}
            onChange={handleSelectedDateChange}
          />
          <button
            type="button"
            onClick={() => prevRecordDate && setSelectedDate(prevRecordDate)}
            disabled={!prevRecordDate}
            className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title={prevRecordDate ? `Naar ${prevRecordDate}` : 'Geen vorige record'}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => nextRecordDate && setSelectedDate(nextRecordDate)}
            disabled={!nextRecordDate}
            className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title={nextRecordDate ? `Naar ${nextRecordDate}` : 'Geen volgende record'}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <span />
        {kpiDescriptions.map((kpi) => {
          const val = kpiValues[kpi.kpi_key] ?? '';
          const boundStr = formatBound(kpi.bound);
          const unitSuffix = (kpi.unit || '').toLowerCase() === 'percentage' ? '%' : '';

          return (
            <React.Fragment key={kpi.kpi_key}>
              <label htmlFor={`kpi-${kpi.kpi_key}`} className="permits-form-label">
                {kpi.title} {boundStr && `(${boundStr})`}
              </label>
              <div className="permits-form-input-wrap permits-form-input-wrap-with-pill">
                <input
                  id={`kpi-${kpi.kpi_key}`}
                  type="number"
                  className="permits-form-input"
                  value={val}
                  min={0}
                  onChange={(e) => {
                    const v = e.target.value === '' ? '' : Number(e.target.value);
                    setKpiValue(kpi.kpi_key, v);
                  }}
                  onFocus={() => setFocusedKpiKey(kpi.kpi_key)}
                  onBlur={() => setFocusedKpiKey(null)}
                  disabled={!canEdit}
                  readOnly={!canEdit}
                />
                <span className="permits-form-unit">{unitSuffix}</span>
                {focusedKpiKey === kpi.kpi_key && val !== '' && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setKpiValue(kpi.kpi_key, '')}
                    disabled={!canEdit}
                    className="px-2 py-0.5 rounded-full text-xs bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                    title="Leegmaken"
                  >
                    geen
                  </button>
                )}
              </div>
              <span />
            </React.Fragment>
          );
        })}
      </div>

      {!canEdit && (
        <div className="text-center">
          <span className="text-sm text-amber-600">Alleen bekijken (alleen toekomstige datums kunnen worden gewijzigd)</span>
        </div>
      )}

      <div className="permits-form-actions">
        {!hideCancel && (
          <button className="permits-form-cancel-button" onClick={onCancel}>
            Afbreken
          </button>
        )}
        <button
          className={`permits-form-save-button ${canEdit && isValid && isChanged ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
          onClick={handleOk}
          disabled={!canEdit || !isValid || !isChanged}
        >
          Opslaan
        </button>
      </div>
    </div>
  );
};

export default PermitLimitsEditor;
