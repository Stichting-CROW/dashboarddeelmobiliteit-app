/**
 * Pure operations for permit limits case matrix (set KPI at date D, value or absent).
 * Full-record delete: planDeleteRecord extends previous record's end_date, then caller DELETE.
 * Resetting a KPI (set to absent) is separate from full record delete.
 */

import type { GeometryOperatorModalityLimit } from '../../api/permitLimits';
import { toDateOnly } from './permitLimitsUtils';

export type SetKpiValue = number | 'absent';

export interface OperationContext {
  operator: string;
  geometry_ref: string;
  form_factor: string;
  propulsion_type: string;
}

export type PlannedOp =
  | { type: 'PUT'; record: GeometryOperatorModalityLimit }
  | { type: 'POST'; record: GeometryOperatorModalityLimit };

/** Sorted by effective_date ascending (date-only comparison) */
function sortHistory(history: GeometryOperatorModalityLimit[]): GeometryOperatorModalityLimit[] {
  return [...history].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
}

/**
 * Returns the record whose interval contains date D, and the next record (for end_date).
 * Interval: [effective_date, end_date) where end_date = next.effective_date or infinity.
 * Uses date-only comparison (no timezone).
 */
export function findRecordContainingDate(
  history: GeometryOperatorModalityLimit[] | null,
  date: string
): { record: GeometryOperatorModalityLimit; index: number; nextRecord: GeometryOperatorModalityLimit | null } | null {
  if (!history || history.length === 0) return null;
  const sorted = sortHistory(history);
  const d = toDateOnly(date);
  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const endDate = i < sorted.length - 1 ? toDateOnly(sorted[i + 1].effective_date) : undefined;
    const end = endDate ?? '9999-12-31';
    const start = toDateOnly(record.effective_date);
    if (d >= start && d < end) {
      return {
        record,
        index: i,
        nextRecord: i < sorted.length - 1 ? sorted[i + 1] : null,
      };
    }
  }
  return null;
}

/**
 * end_date for a record: explicit end_date or next.effective_date. Last record has no end (infinity).
 */
export function computeEndDate(
  record: GeometryOperatorModalityLimit,
  nextRecord: GeometryOperatorModalityLimit | null
): string | undefined {
  if (record.end_date) return record.end_date;
  return nextRecord?.effective_date;
}

/**
 * Plan full record delete: extend previous record's end_date to the deleted record's end_date,
 * then DELETE the record. Returns the previous record with updated end_date (if any), or null.
 * Caller must: 1) PUT the returned record (if non-null), 2) DELETE the record by id.
 */
export function planDeleteRecord(
  history: GeometryOperatorModalityLimit[] | null,
  recordToDelete: GeometryOperatorModalityLimit
): GeometryOperatorModalityLimit | null {
  if (!history || history.length === 0) return null;
  const sorted = sortHistory(history);
  const idx = sorted.findIndex((r) => r.geometry_operator_modality_limit_id === recordToDelete.geometry_operator_modality_limit_id);
  if (idx < 0) return null;
  const prevRecord = idx > 0 ? sorted[idx - 1] : null;
  if (!prevRecord || !prevRecord.geometry_operator_modality_limit_id) return null;
  const nextRecord = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const newEndDate = recordToDelete.end_date ?? nextRecord?.effective_date ?? undefined;
  return { ...prevRecord, end_date: newEndDate };
}

/**
 * Plan operations to set a single KPI X at date D to value v or absent.
 * Returns list of PUT then POST (when splitting, UPDATE R1 then POST R2).
 */
export function planSetKpiAtDate(
  history: GeometryOperatorModalityLimit[] | null,
  date: string,
  kpiKey: string,
  value: SetKpiValue,
  ctx: OperationContext
): PlannedOp[] {
  const sorted = history ? sortHistory(history) : [];
  const d = toDateOnly(date);
  const hasEarlier = sorted.some((r) => toDateOnly(r.effective_date) < d);
  const hasLater = sorted.some((r) => toDateOnly(r.effective_date) > d);
  const found = findRecordContainingDate(history, date);

  const applyValue = (limits: Record<string, number>): Record<string, number> => {
    const next = { ...limits };
    if (value === 'absent') {
      delete next[kpiKey];
    } else {
      next[kpiKey] = value;
    }
    return next;
  };

  // D equals some record's effective_date -> UPDATE in place
  if (found && toDateOnly(found.record.effective_date) === d) {
    const record = found.record;
    const newLimits = applyValue(record.limits);
    if (!record.geometry_operator_modality_limit_id) return [];
    return [
      {
        type: 'PUT',
        record: {
          ...record,
          ...ctx,
          limits: newLimits,
        },
      },
    ];
  }

  // No record covers D
  if (!found) {
    const limits = value === 'absent' ? {} : { [kpiKey]: value };
    const firstRecord = sorted[0];
    const lastRecord = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    if (!hasEarlier && !hasLater) {
      return [{ type: 'POST', record: { ...ctx, effective_date: d, limits } }];
    }
    if (!hasEarlier && hasLater) {
      return [
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            end_date: toDateOnly(firstRecord.effective_date),
            limits: { ...(firstRecord?.limits ?? {}), ...limits },
          },
        },
      ];
    }
    if (hasEarlier && !hasLater) {
      const prev = lastRecord!;
      return [
        { type: 'PUT', record: { ...prev, ...ctx, end_date: d } },
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            limits: { ...prev.limits, ...limits },
          },
        },
      ];
    }
    // hasEarlier && hasLater but no record contains D -> D is in a gap; treat as insert before first that is > D
    const nextRecord = sorted.find((r) => toDateOnly(r.effective_date) > d);
    const prevRecord = sorted.filter((r) => toDateOnly(r.effective_date) < d).pop();
    if (nextRecord && prevRecord) {
      return [
        { type: 'PUT', record: { ...prevRecord, ...ctx, end_date: d } },
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            end_date: toDateOnly(nextRecord.effective_date),
            limits: { ...nextRecord.limits, ...limits },
          },
        },
      ];
    }
    if (nextRecord) {
      return [
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            end_date: toDateOnly(nextRecord.effective_date),
            limits: { ...nextRecord.limits, ...limits },
          },
        },
      ];
    }
    return [];
  }

  // Split: D is strictly inside R's interval
  const { record, nextRecord } = found;
  const endOfR1 = d;
  const endOfR2 = computeEndDate(record, nextRecord);

  const r1Limits = { ...record.limits };
  const r2Limits = applyValue({ ...record.limits });

  const r1: GeometryOperatorModalityLimit = {
    ...record,
    ...ctx,
    effective_date: toDateOnly(record.effective_date),
    end_date: endOfR1,
    limits: r1Limits,
  };
  const r2: GeometryOperatorModalityLimit = {
    ...ctx,
    effective_date: d,
    ...(endOfR2 && { end_date: toDateOnly(endOfR2) }),
    limits: r2Limits,
  };

  return [
    { type: 'PUT', record: r1 },
    { type: 'POST', record: r2 },
  ];
}

/**
 * Plan operations to set a full record at date D (all KPIs in limits).
 * Either POST new, UPDATE in place, or split then PUT + POST.
 */
export function planSetFullRecordAtDate(
  history: GeometryOperatorModalityLimit[] | null,
  date: string,
  limits: Record<string, number>,
  ctx: OperationContext
): PlannedOp[] {
  const sorted = history ? sortHistory(history) : [];
  const d = toDateOnly(date);
  const hasEarlier = sorted.some((r) => toDateOnly(r.effective_date) < d);
  const hasLater = sorted.some((r) => toDateOnly(r.effective_date) > d);
  const found = findRecordContainingDate(history, date);

  if (found && toDateOnly(found.record.effective_date) === d) {
    const record = found.record;
    if (!record.geometry_operator_modality_limit_id) return [];
    return [
      {
        type: 'PUT',
        record: { ...record, ...ctx, limits },
      },
    ];
  }

  if (!found) {
    if (!hasEarlier && !hasLater) {
      return [{ type: 'POST', record: { ...ctx, effective_date: d, limits } }];
    }
    if (!hasEarlier && hasLater) {
      const first = sorted[0];
      return [
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            end_date: toDateOnly(first.effective_date),
            limits,
          },
        },
      ];
    }
    if (hasEarlier && !hasLater) {
      const prev = sorted[sorted.length - 1];
      return [
        { type: 'PUT', record: { ...prev, ...ctx, end_date: d } },
        { type: 'POST', record: { ...ctx, effective_date: d, limits } },
      ];
    }
    const nextRecord = sorted.find((r) => toDateOnly(r.effective_date) > d);
    const prevRecord = sorted.filter((r) => toDateOnly(r.effective_date) < d).pop();
    if (nextRecord && prevRecord) {
      return [
        { type: 'PUT', record: { ...prevRecord, ...ctx, end_date: d } },
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            end_date: toDateOnly(nextRecord.effective_date),
            limits,
          },
        },
      ];
    }
    if (nextRecord) {
      return [
        {
          type: 'POST',
          record: {
            ...ctx,
            effective_date: d,
            end_date: toDateOnly(nextRecord.effective_date),
            limits,
          },
        },
      ];
    }
    return [];
  }

  const { record, nextRecord } = found;
  const endOfR2 = computeEndDate(record, nextRecord);
  const r1: GeometryOperatorModalityLimit = {
    ...record,
    ...ctx,
    end_date: d,
    limits: record.limits,
  };
  const r2: GeometryOperatorModalityLimit = {
    ...ctx,
    effective_date: d,
    ...(endOfR2 && { end_date: toDateOnly(endOfR2) }),
    limits,
  };
  return [
    { type: 'PUT', record: r1 },
    { type: 'POST', record: r2 },
  ];
}

/** Random value 1..100 for KPIs */
export function randomKpiValue(): number {
  return Math.floor(Math.random() * 100) + 1;
}

/** Pick random subset of array */
export function pickRandomSubset<T>(arr: T[], minCount = 0, maxCount?: number): T[] {
  if (arr.length === 0) return [];
  const n = maxCount ?? arr.length;
  const count = Math.max(minCount, Math.min(n, Math.floor(Math.random() * (arr.length + 1))));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
