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
  /** When adding for a date with no record, pre-fill KPI values from previous record (or empty) */
  initialKpiValuesWhenNoRecord?: Record<string, number | ''>;
  onSave: (data: GeometryOperatorModalityLimit) => void | Promise<void>;
  onCancel: () => void;
  onRecordUpdated: () => void;
  /** Called when user confirms deletion of current record; only shown when currentRecord exists */
  onDelete?: (record: GeometryOperatorModalityLimit) => void | Promise<void>;
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
  initialKpiValuesWhenNoRecord,
  onSave,
  onCancel,
  onDelete,
}) => {
  const today = moment().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate ?? focusDate ?? today);

  const firstRecordDate = useMemo(() => {
    if (!limitHistory || limitHistory.length === 0) return undefined;
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

  const { currentRecord, currentRecordIndex, sortedHistory, prevRecordForGap } = useMemo(() => {
    if (!limitHistory || limitHistory.length === 0) {
      return {
        currentRecord: null as GeometryOperatorModalityLimit | null,
        currentRecordIndex: -1,
        sortedHistory: [] as GeometryOperatorModalityLimit[],
        prevRecordForGap: null as GeometryOperatorModalityLimit | null,
      };
    }
    const sorted = [...limitHistory].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
    const sel = toDateOnly(selectedDate);
    for (let i = 0; i < sorted.length; i++) {
      const startdate = toDateOnly(sorted[i].effective_date);
      const nextStart = i < sorted.length - 1 ? toDateOnly(sorted[i + 1].effective_date) : '9999-12-31';
      if (sel >= startdate && (nextStart === '9999-12-31' ? sel <= nextStart : sel < nextStart)) {
        return {
          currentRecord: sorted[i],
          currentRecordIndex: i,
          sortedHistory: sorted,
          prevRecordForGap: null,
        };
      }
    }
    const before = sorted.filter((r) => toDateOnly(r.effective_date) < sel);
    const prev = before.length > 0 ? before[before.length - 1] : null;
    return {
      currentRecord: null,
      currentRecordIndex: -1,
      sortedHistory: sorted,
      prevRecordForGap: prev,
    };
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
    const hasNoRecords = !limitHistory || limitHistory.length === 0;
    const sourceRecord = currentRecord ?? prevRecordForGap ?? null;
    const sourceLimits = sourceRecord?.limits;

    if (hasNoRecords || !sourceRecord) {
      kpiDescriptions.forEach((kpi) => { next[kpi.kpi_key] = ''; });
    } else {
      kpiDescriptions.forEach((kpi) => {
        if (sourceLimits && kpi.kpi_key in sourceLimits) {
          const val = sourceLimits[kpi.kpi_key];
          next[kpi.kpi_key] = typeof val === 'number' ? val : '';
        } else if (initialKpiValuesWhenNoRecord && kpi.kpi_key in initialKpiValuesWhenNoRecord) {
          next[kpi.kpi_key] = initialKpiValuesWhenNoRecord[kpi.kpi_key];
        } else {
          next[kpi.kpi_key] = '';
        }
      });
    }
    setKpiValues(next);
  }, [limitHistory, currentRecord, prevRecordForGap, kpiDescriptions, initialKpiValuesWhenNoRecord]);

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

  const dateMin = minDate ?? firstRecordDate ?? undefined;
  const canEdit = allowChange || toDateOnly(selectedDate) >= today;

  const isEditingExistingRecord =
    currentRecord?.geometry_operator_modality_limit_id &&
    toDateOnly(selectedDate) === toDateOnly(currentRecord.effective_date);
  const saveButtonLabel = isEditingExistingRecord ? 'Wijzigen' : 'Toevoegen';

  const statusText = useMemo(() => {
    const isNewRecord = !isEditingExistingRecord;
    if (isNewRecord) {
      const startDate = toDateOnly(selectedDate);
      const endDate = nextRecordDate ?? null;
      if (endDate) {
        return `Deze configuratie wordt actief van ${moment(startDate).format('L')} tot ${moment(endDate).format('L')}`;
      }
      return `Deze configuratie wordt actief vanaf ${moment(startDate).format('L')}`;
    }
    if (!currentRecord) return 'Geen configuratie actief';
    const effectiveEnd = currentRecord.end_date ??
      (currentRecordIndex < sortedHistory.length - 1 ? toDateOnly(sortedHistory[currentRecordIndex + 1].effective_date) : undefined);
    return effectiveEnd
      ? `Deze configuratie is actief van ${moment(currentRecord.effective_date).format('L')} tot ${moment(effectiveEnd).format('L')}`
      : `Deze configuratie is actief vanaf ${moment(currentRecord.effective_date).format('L')}`;
  }, [currentRecord, currentRecordIndex, sortedHistory, isEditingExistingRecord, selectedDate, nextRecordDate]);

  const handleDeleteClick = () => {
    if (!currentRecord || !currentRecord.geometry_operator_modality_limit_id || !onDelete) return;
    const baseMsg = `Hiermee verwijdert u de complete configuratie die ingaat op ${moment(currentRecord.effective_date).format('L')}.`;
    let extraMsg: string;
    if (!prevRecordDate && !nextRecordDate) {
      extraMsg = 'Er is hierna geen configuratie meer actief.';
    } else if (!prevRecordDate && nextRecordDate) {
      extraMsg = `De eerstvolgende configuratie gaat in op ${moment(nextRecordDate).format('L')}.`;
    } else if (prevRecordDate && nextRecordDate) {
      extraMsg = `De configuratie van ${moment(prevRecordDate).format('L')} wordt verlengd tot ${moment(nextRecordDate).format('L')}.`;
    } else {
      extraMsg = `De configuratie van ${moment(prevRecordDate).format('L')} wordt onbeperkt verlengd.`;
    }
    if (window.confirm(`${baseMsg}\n\n${extraMsg}\n\nWeet u zeker dat u wilt doorgaan?`)) {
      onDelete(currentRecord);
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col items-center">
        <span>{statusText}</span>
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
        <div className="flex-1">
          {isEditingExistingRecord && currentRecord?.geometry_operator_modality_limit_id && onDelete && canEdit && (
            <button
              type="button"
              className="permits-form-delete-button"
              onClick={handleDeleteClick}
            >
              Configuratie Verwijderen
            </button>
          )}
        </div>
        <div className="flex gap-2">
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
            {saveButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermitLimitsEditor;
