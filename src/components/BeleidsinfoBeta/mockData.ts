/**
 * Mock data for the Beleidsinfo (beta) mockup page.
 *
 * All data here is FICTIONAL and deterministic (seeded pseudo-random),
 * so the mockup renders the same way every time. It is meant to
 * illustrate the proposed charts, not to represent real measurements.
 */

import moment from 'moment';

/* ------------------------------------------------------------------ */
/* Modalities                                                          */
/* ------------------------------------------------------------------ */

export type ModalityKey = 'bicycle' | 'cargo_bicycle' | 'moped' | 'car';

export interface Modality {
  key: ModalityKey;
  label: string;
  color: string;
}

export const MODALITIES: readonly Modality[] = [
  { key: 'bicycle', label: 'Fiets', color: '#15AEEF' },
  { key: 'cargo_bicycle', label: 'Bakfiets', color: '#1F8E3D' },
  { key: 'moped', label: 'Scooter', color: '#FD862E' },
  { key: 'car', label: 'Auto', color: '#7B61FF' }
] as const;

export const getModality = (key: ModalityKey): Modality =>
  MODALITIES.find((m) => m.key === key) ?? MODALITIES[0];

/* ------------------------------------------------------------------ */
/* Category definitions                                                */
/* ------------------------------------------------------------------ */

export interface Category {
  key: string;
  label: string;
  color: string;
}

/** Six "dagdelen" (4-hour blocks) used for the rentals-over-the-day chart. */
export const DAGDELEN: readonly Category[] = [
  { key: 'p0', label: '00–04 uur', color: '#1E3A8A' },
  { key: 'p1', label: '04–08 uur', color: '#3B82F6' },
  { key: 'p2', label: '08–12 uur', color: '#FBBF24' },
  { key: 'p3', label: '12–16 uur', color: '#F97316' },
  { key: 'p4', label: '16–20 uur', color: '#EF4444' },
  { key: 'p5', label: '20–24 uur', color: '#7C3AED' }
] as const;

/** Six measurement moments per day (used for dekkingsgraad and hubs). */
export const MOMENTEN: readonly Category[] = [
  { key: 'm0330', label: '03:30', color: '#1E3A8A' },
  { key: 'm0730', label: '07:30', color: '#3B82F6' },
  { key: 'm1130', label: '11:30', color: '#FBBF24' },
  { key: 'm1530', label: '15:30', color: '#F97316' },
  { key: 'm1930', label: '19:30', color: '#EF4444' },
  { key: 'm2330', label: '23:30', color: '#7C3AED' }
] as const;

/** Distance classes (as the crow flies). */
export const AFSTANDSKLASSEN: readonly Category[] = [
  { key: 'd0', label: '< 1 km', color: '#CCFBF1' },
  { key: 'd1', label: '1–2 km', color: '#5EEAD4' },
  { key: 'd2', label: '2–5 km', color: '#14B8A6' },
  { key: 'd3', label: '5–10 km', color: '#0F766E' },
  { key: 'd4', label: '> 10 km', color: '#134E4A' }
] as const;

/** Rental duration classes. */
export const VERHUURDUURKLASSEN: readonly Category[] = [
  { key: 't0', label: '< 10 min', color: '#EDE9FE' },
  { key: 't1', label: '10–30 min', color: '#C4B5FD' },
  { key: 't2', label: '30–60 min', color: '#A78BFA' },
  { key: 't3', label: '1–3 uur', color: '#7C3AED' },
  { key: 't4', label: '3–24 uur', color: '#5B21B6' },
  { key: 't5', label: '> 24 uur', color: '#2E1065' }
] as const;

/* ------------------------------------------------------------------ */
/* Seeded pseudo-random helpers                                        */
/* ------------------------------------------------------------------ */

/** Small deterministic PRNG (mulberry32). */
const createRng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const round = (n: number, decimals = 0): number => {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
};

/* ------------------------------------------------------------------ */
/* Time axis helpers                                                   */
/* ------------------------------------------------------------------ */

export type AggregationLevel = 'day' | 'week' | 'month' | string;

export interface TimeBucket {
  /** ISO start of bucket */
  iso: string;
  /** Human-friendly label for the X axis */
  label: string;
  /** Number of days in the bucket (used for averages) */
  days: number;
}

const getDateFormat = (agg: AggregationLevel): string => {
  if (agg === 'month') return 'MMM YYYY';
  if (agg === 'week') return '[wk] W';
  return 'DD MMM';
};

/**
 * Build the time buckets for the selected period + aggregation level.
 * Keeps the number of buckets reasonable (max ~400) so the mockup stays snappy.
 */
export const getTimeBuckets = (
  van: string | Date,
  tot: string | Date,
  agg: AggregationLevel
): TimeBucket[] => {
  const start = moment(van).startOf('day');
  const end = moment(tot).endOf('day');
  const unit: moment.unitOfTime.DurationConstructor =
    agg === 'month' ? 'month' : agg === 'week' ? 'week' : 'day';
  const fmt = getDateFormat(agg);
  const buckets: TimeBucket[] = [];
  const cursor = start.clone().startOf(unit === 'day' ? 'day' : unit);
  let guard = 0;
  while (cursor.isSameOrBefore(end) && guard < 400) {
    const bucketEnd = moment.min(cursor.clone().endOf(unit), end);
    const bucketStart = moment.max(cursor.clone(), start);
    const days = Math.max(1, bucketEnd.diff(bucketStart, 'days') + 1);
    buckets.push({ iso: cursor.toISOString(), label: cursor.format(fmt), days });
    cursor.add(1, unit);
    guard++;
  }
  return buckets;
};

/* ------------------------------------------------------------------ */
/* Series generators                                                   */
/* ------------------------------------------------------------------ */

export interface ModalitySeriesPoint {
  time: string;
  [modalityKey: string]: number | string;
}

interface ModalityProfile {
  base: number;
  /** Relative noise amplitude (0..1) */
  noise: number;
  /** Linear trend per bucket (relative to base) */
  trend: number;
  /** Weekly seasonality amplitude (relative) */
  weekly: number;
}

const DEFAULT_PROFILES: Record<ModalityKey, ModalityProfile> = {
  bicycle: { base: 1, noise: 0.12, trend: 0.0025, weekly: 0.15 },
  cargo_bicycle: { base: 1, noise: 0.2, trend: 0.004, weekly: 0.1 },
  moped: { base: 1, noise: 0.14, trend: -0.001, weekly: 0.2 },
  car: { base: 1, noise: 0.08, trend: 0.001, weekly: 0.05 }
};

/**
 * Generate a per-modality time series over the selected period.
 * `scale` sets the magnitude per modality; the result is scaled by the
 * profile trends and weekly seasonality with deterministic noise.
 */
export const generateModalitySeries = (
  buckets: TimeBucket[],
  scale: Record<ModalityKey, number>,
  seedLabel: string,
  decimals = 0,
  clamp?: { min?: number; max?: number }
): ModalitySeriesPoint[] => {
  const rng = createRng(hashString(seedLabel));
  return buckets.map((b, i) => {
    const row: ModalitySeriesPoint = { time: b.label };
    const dow = moment(b.iso).isoWeekday(); // 1..7
    MODALITIES.forEach((m) => {
      const p = DEFAULT_PROFILES[m.key];
      const weekend = dow >= 6 ? 1 + p.weekly : 1 - p.weekly * 0.3;
      const trend = 1 + p.trend * i;
      const noise = 1 + (rng() - 0.5) * 2 * p.noise;
      let v = scale[m.key] * p.base * weekend * trend * noise;
      if (clamp?.min !== undefined) v = Math.max(clamp.min, v);
      if (clamp?.max !== undefined) v = Math.min(clamp.max, v);
      row[m.key] = round(v, decimals);
    });
    return row;
  });
};

/** 1. Max beschikbare voertuigen per dag (gemiddeld per bucket). */
export const getMaxBeschikbareVoertuigen = (buckets: TimeBucket[]): ModalitySeriesPoint[] =>
  generateModalitySeries(
    buckets,
    { bicycle: 1450, cargo_bicycle: 85, moped: 620, car: 140 },
    'max-beschikbaar'
  );

export type RentalSource = 'vehicles' | 'trips';

/** 2. Aantal verhuringen per dag (gemiddeld per bucket). */
export const getVerhuringenPerDag = (
  buckets: TimeBucket[],
  source: RentalSource
): ModalitySeriesPoint[] => {
  const f = source === 'trips' ? 1.06 : 1;
  return generateModalitySeries(
    buckets,
    { bicycle: 2100 * f, cargo_bicycle: 60 * f, moped: 1350 * f, car: 95 * f },
    `verhuringen-${source}`
  );
};

/** 3. Gebruiksratio: verhuringen per voertuig per dag. */
export const getGebruiksratio = (
  buckets: TimeBucket[],
  source: RentalSource
): ModalitySeriesPoint[] => {
  const beschikbaar = getMaxBeschikbareVoertuigen(buckets);
  const verhuringen = getVerhuringenPerDag(buckets, source);
  return buckets.map((b, i) => {
    const row: ModalitySeriesPoint = { time: b.label };
    MODALITIES.forEach((m) => {
      const n = Number(verhuringen[i][m.key]) || 0;
      const d = Number(beschikbaar[i][m.key]) || 1;
      row[m.key] = round(n / d, 2);
    });
    return row;
  });
};

/** 5. Percentage voertuigen niet beschikbaar (om 03:30). */
export const getPercentageNietBeschikbaar = (buckets: TimeBucket[]): ModalitySeriesPoint[] =>
  generateModalitySeries(
    buckets,
    { bicycle: 6.5, cargo_bicycle: 11, moped: 9, car: 4 },
    'niet-beschikbaar',
    1,
    { min: 0, max: 100 }
  );

/* ------------------------------------------------------------------ */
/* Distribution generators (100% stacked columns)                       */
/* ------------------------------------------------------------------ */

export interface DistributionRow {
  modality: string;
  modalityKey: ModalityKey;
  [categoryKey: string]: number | string;
}

/**
 * Build a 100%-distribution per modality across a set of categories.
 * `weights` gives the rough shape per modality (does not need to sum to 1).
 */
const buildDistribution = (
  categories: readonly Category[],
  weights: Record<ModalityKey, number[]>,
  seedLabel: string
): DistributionRow[] => {
  const rng = createRng(hashString(seedLabel));
  return MODALITIES.map((m) => {
    const w = weights[m.key].map((x) => x * (0.85 + rng() * 0.3));
    const total = w.reduce((a, b) => a + b, 0);
    const row: DistributionRow = { modality: m.label, modalityKey: m.key };
    let acc = 0;
    categories.forEach((c, i) => {
      // last category takes the remainder so rows sum to exactly 100
      const v = i === categories.length - 1 ? round(100 - acc, 1) : round((w[i] / total) * 100, 1);
      acc += v;
      row[c.key] = v;
    });
    return row;
  });
};

/** 4. Verdeling van de verhuringen over de dag (6 dagdelen). */
export const getVerdelingOverDeDag = (): DistributionRow[] =>
  buildDistribution(
    DAGDELEN,
    {
      bicycle: [3, 9, 24, 26, 27, 11],
      cargo_bicycle: [1, 6, 30, 32, 24, 7],
      moped: [6, 8, 20, 24, 26, 16],
      car: [2, 10, 22, 22, 28, 16]
    },
    'verdeling-dag'
  );

/** 6. Verdeling verhuringen naar afstandsklasse (hemelsbreed). */
export const getVerdelingAfstand = (): DistributionRow[] =>
  buildDistribution(
    AFSTANDSKLASSEN,
    {
      bicycle: [28, 34, 30, 7, 1],
      cargo_bicycle: [30, 36, 28, 5, 1],
      moped: [12, 26, 40, 18, 4],
      car: [4, 8, 24, 30, 34]
    },
    'verdeling-afstand'
  );

/** 7. Verdeling verhuringen naar verhuurduur. */
export const getVerdelingVerhuurduur = (): DistributionRow[] =>
  buildDistribution(
    VERHUURDUURKLASSEN,
    {
      bicycle: [30, 45, 15, 6, 3, 1],
      cargo_bicycle: [6, 30, 32, 22, 8, 2],
      moped: [26, 48, 17, 6, 2, 1],
      car: [2, 10, 18, 30, 32, 8]
    },
    'verdeling-duur'
  );

/* ------------------------------------------------------------------ */
/* Grouped columns: dekkingsgraad per moment van de dag                 */
/* ------------------------------------------------------------------ */

export interface GroupedRow {
  modality: string;
  modalityKey: ModalityKey;
  [momentKey: string]: number | string;
}

/** 8. Gemiddelde dekkingsgraad (% huishoudens) per modaliteit per moment. */
export const getDekkingsgraadPerMoment = (): GroupedRow[] => {
  const rng = createRng(hashString('dekkingsgraad'));
  const base: Record<ModalityKey, number> = {
    bicycle: 78,
    cargo_bicycle: 31,
    moped: 64,
    car: 22
  };
  // Coverage is typically highest at night (vehicles parked) and dips during commute peaks.
  const momentFactor = [1.0, 0.97, 0.9, 0.88, 0.86, 0.95];
  return MODALITIES.map((m) => {
    const row: GroupedRow = { modality: m.label, modalityKey: m.key };
    MOMENTEN.forEach((mo, i) => {
      const v = base[m.key] * momentFactor[i] * (0.96 + rng() * 0.08);
      row[mo.key] = round(Math.min(100, v), 1);
    });
    return row;
  });
};

/* ------------------------------------------------------------------ */
/* Line with 6 moments per day: aandeel voertuigen in hubs              */
/* ------------------------------------------------------------------ */

export interface MomentSeriesPoint {
  /** e.g. "12 mrt 07:30" */
  time: string;
  /** ISO for tooltips */
  iso: string;
  /** true for the first moment of a day (used to draw fewer X ticks) */
  isDayStart: boolean;
  /** Short day label, e.g. "12 mrt" (used for the X ticks) */
  dayLabel: string;
  [modalityKey: string]: number | string | boolean;
}

/**
 * 9. Aandeel voertuigen in hubs (% van de voertuigen in de openbare ruimte),
 * op 6 momenten per dag. Only the daily (or finer) granularity makes sense
 * here, so we always emit 6 points per day within the selected period.
 * Capped to the last `maxDays` days to keep the chart readable.
 */
export const getAandeelVoertuigenInHubs = (
  van: string | Date,
  tot: string | Date,
  maxDays = 31
): MomentSeriesPoint[] => {
  const end = moment(tot).startOf('day');
  let start = moment(van).startOf('day');
  if (end.diff(start, 'days') + 1 > maxDays) {
    start = end.clone().subtract(maxDays - 1, 'days');
  }
  const rng = createRng(hashString('hubs'));
  const base: Record<ModalityKey, number> = {
    bicycle: 42,
    cargo_bicycle: 55,
    moped: 36,
    car: 71
  };
  const hours = [3.5, 7.5, 11.5, 15.5, 19.5, 23.5];
  // Share in hubs is highest at night, lowest in the afternoon.
  const factor = [1.12, 1.05, 0.92, 0.86, 0.9, 1.06];
  const points: MomentSeriesPoint[] = [];
  const cursor = start.clone();
  let dayIndex = 0;
  while (cursor.isSameOrBefore(end)) {
    hours.forEach((h, i) => {
      const t = cursor.clone().add(h, 'hours');
      const row: MomentSeriesPoint = {
        time: t.format('DD MMM HH:mm'),
        iso: t.toISOString(),
        isDayStart: i === 0,
        dayLabel: t.format('DD MMM')
      };
      MODALITIES.forEach((m) => {
        const trend = 1 + dayIndex * 0.002;
        const v = base[m.key] * factor[i] * trend * (0.97 + rng() * 0.06);
        row[m.key] = round(Math.min(100, v), 1);
      });
      points.push(row);
    });
    cursor.add(1, 'day');
    dayIndex++;
  }
  return points;
};

/* ------------------------------------------------------------------ */
/* Horizontal bars: top 15 HB-relaties                                  */
/* ------------------------------------------------------------------ */

export interface HbRelation {
  label: string;
  from: string;
  to: string;
  value: number;
}

const CBS_BUURTEN = [
  'Centrum',
  'Stationsbuurt',
  'Binnenstad-Noord',
  'Binnenstad-Zuid',
  'Universiteitsterrein',
  'Zuidas',
  'Oud-West',
  'Oud-Oost',
  'Havenkwartier',
  'Spoorzone',
  'Museumkwartier',
  'Wilhelminapark',
  'Tuindorp',
  'Rivierenwijk',
  'Bloemenbuurt',
  'Ziekenhuisbuurt',
  'Industrieterrein-Noord',
  'Sportpark',
  'Nieuw-West',
  'Lombok'
];

/** 10. Top 15 HB-relaties tussen CBS-buurten (verhuurrelaties per dag). */
export const getTopHbRelaties = (modality: ModalityKey, top = 15): HbRelation[] => {
  const rng = createRng(hashString(`hb-${modality}`));
  const scale: Record<ModalityKey, number> = {
    bicycle: 48,
    cargo_bicycle: 4,
    moped: 31,
    car: 3
  };
  const seen = new Set<string>();
  const rows: HbRelation[] = [];
  let guard = 0;
  while (rows.length < top && guard < 200) {
    guard++;
    const a = CBS_BUURTEN[Math.floor(rng() * CBS_BUURTEN.length)];
    const b = CBS_BUURTEN[Math.floor(rng() * CBS_BUURTEN.length)];
    if (a === b) continue;
    const key = `${a}→${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Decaying distribution so the top looks like a real "top 15"
    const rank = rows.length;
    const v = scale[modality] * Math.pow(0.86, rank) * (0.9 + rng() * 0.2);
    rows.push({ label: `${a} → ${b}`, from: a, to: b, value: round(v, 1) });
  }
  return rows.sort((x, y) => y.value - x.value);
};
