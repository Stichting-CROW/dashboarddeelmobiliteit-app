import type {
  DataQualityDataType,
  DataQualityPeriod,
  FeedAvailability,
  ManualRejection,
  TimeInterval,
} from '../../types/DataQuality';
import { DATA_TYPES, intervalOverlapsPeriod } from './dataQualityUtils';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const FIVE_MINUTES = 5 * 60 * 1000;

export const DEMO_USER = 'demo@dashboarddeelmobiliteit.nl';

const DEMO_VEHICLE_TYPES = ['bicycle', 'cargo_bicycle', 'moped', 'car'];

const DEMO_NOTES = [
  'Voertuigen in depot werden als beschikbaar gedeeld.',
  'Verkeerd voertuigtype doorgegeven (fiets i.p.v. bakfiets).',
  'Dubbele voertuigen in de feed na een update van de aanbieder.',
  'Feed gaf verouderde locaties door.',
  'Verhuringen ontbraken door een fout in de koppeling.',
];

/** Deterministic pseudo-random number in [0, 1) for a string key. */
export const seededRandom = (key: string): number => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

const pick = <T>(items: T[], key: string): T => {
  return items[Math.floor(seededRandom(key) * items.length) % items.length];
};

const iso = (ms: number): string => new Date(ms).toISOString();

/** Pick a deterministic subset of operators that are "active" in the municipality. */
export const pickActiveOperators = (systemIds: string[], gmCode: string | null): string[] => {
  if (!gmCode) return systemIds;
  const minimum = Math.min(3, systemIds.length);
  const scored = systemIds
    .map((systemId) => ({ systemId, score: seededRandom(`${systemId}|${gmCode}|active`) }))
    .sort((a, b) => a.score - b.score);
  return scored
    .filter((item, index) => index < minimum || item.score < 0.6)
    .map((item) => item.systemId)
    .sort();
};

const buildOutages = (systemId: string, dataType: DataQualityDataType, now: number): TimeInterval[] => {
  const outages: TimeInterval[] = [];
  const count = Math.floor(seededRandom(`${systemId}|${dataType}|count`) * 4);
  for (let i = 0; i < count; i++) {
    const daysAgo = 1 + Math.floor(seededRandom(`${systemId}|${dataType}|${i}|day`) * 40);
    const hour = Math.floor(seededRandom(`${systemId}|${dataType}|${i}|hour`) * 24);
    const durationMinutes = 20 + Math.floor(seededRandom(`${systemId}|${dataType}|${i}|dur`) * 360);
    const start = now - daysAgo * DAY + hour * HOUR;
    outages.push({
      start_time: iso(start),
      end_time: iso(Math.min(start + durationMinutes * 60 * 1000, now - HOUR)),
    });
  }
  if (dataType === 'aanbod' && seededRandom(`${systemId}|ongoing`) < 0.15) {
    outages.push({ start_time: iso(now - 3 * HOUR), end_time: null });
  }
  return outages;
};

const availabilityPct = (
  outages: TimeInterval[],
  period: DataQualityPeriod,
  now: number
): number | null => {
  const observedEnd = Math.min(period.end, now);
  const observed = observedEnd - period.start;
  if (observed <= 0) return null;
  const down = outages.reduce((total, outage) => {
    const start = Math.max(new Date(outage.start_time).getTime(), period.start);
    const end = Math.min(outage.end_time ? new Date(outage.end_time).getTime() : now, observedEnd);
    return total + Math.max(0, end - start);
  }, 0);
  return Math.round((1 - down / observed) * 1000) / 10;
};

export const buildDemoFeeds = (
  systemIds: string[],
  period: DataQualityPeriod,
  now: number
): FeedAvailability[] => {
  const lastCheck = Math.floor(now / FIVE_MINUTES) * FIVE_MINUTES;

  return systemIds.flatMap((systemId) =>
    DATA_TYPES.map((dataType): FeedAvailability => {
      const notExpected =
        dataType === 'servicegebieden' && seededRandom(`${systemId}|sa`) < 0.6;
      const unknown =
        dataType === 'verhuringen' && seededRandom(`${systemId}|unknown`) > 0.92;

      if (notExpected || unknown) {
        return {
          system_id: systemId,
          data_type: dataType,
          status: notExpected ? 'not_expected' : 'unknown',
          last_checked_at: notExpected ? iso(lastCheck) : null,
          last_data_received_at: null,
          availability_pct: null,
          outages: [],
        };
      }

      const allOutages = buildOutages(systemId, dataType, now);
      const ongoing = allOutages.find((outage) => outage.end_time === null);
      return {
        system_id: systemId,
        data_type: dataType,
        status: ongoing ? 'unavailable' : 'available',
        last_checked_at: iso(lastCheck),
        last_data_received_at: ongoing ? ongoing.start_time : iso(lastCheck),
        availability_pct: availabilityPct(allOutages, period, now),
        outages: allOutages.filter((outage) => intervalOverlapsPeriod(outage, period, now)),
      };
    })
  );
};

/**
 * Rejections are anchored to `now` (not to the selected period), so changing
 * the period or municipality filter visibly changes what is shown.
 */
export const buildDemoRejections = (
  systemIds: string[],
  gmCodes: string[],
  now: number
): ManualRejection[] => {
  const rejections: ManualRejection[] = [];
  let nextId = 1;

  systemIds.forEach((systemId) => {
    if (seededRandom(`${systemId}|rejection`) >= 0.35) return;

    const daysAgo = 1 + Math.floor(seededRandom(`${systemId}|rejection|day`) * 25);
    const durationHours = 4 + Math.floor(seededRandom(`${systemId}|rejection|dur`) * 72);
    const start = Math.floor((now - daysAgo * DAY) / HOUR) * HOUR;
    const isOngoing = seededRandom(`${systemId}|rejection|ongoing`) < 0.2;
    const useAllMunicipalities =
      gmCodes.length === 0 || seededRandom(`${systemId}|rejection|area`) < 0.5;
    const useAllVehicleTypes = seededRandom(`${systemId}|rejection|vt`) < 0.6;

    rejections.push({
      rejection_id: nextId++,
      system_ids: [systemId],
      start_time: iso(start),
      end_time: isOngoing ? null : iso(start + durationHours * HOUR),
      municipalities: useAllMunicipalities
        ? 'all'
        : [pick(gmCodes, `${systemId}|rejection|gm`)],
      vehicle_types: useAllVehicleTypes
        ? 'all'
        : [pick(DEMO_VEHICLE_TYPES, `${systemId}|rejection|vtid`)],
      data_types: seededRandom(`${systemId}|rejection|dt`) < 0.5
        ? ['aanbod']
        : ['aanbod', 'verhuringen'],
      issue_owner: 'operator',
      note: pick(DEMO_NOTES, `${systemId}|rejection|note`),
      created_by: DEMO_USER,
      created_at: iso(start + durationHours * HOUR),
      updated_by: null,
      updated_at: null,
    });
  });

  if (systemIds.length > 0) {
    const start = Math.floor((now - 3 * DAY) / DAY) * DAY + 2 * HOUR;
    rejections.push({
      rejection_id: nextId++,
      system_ids: 'all',
      start_time: iso(start),
      end_time: iso(start + 5 * HOUR),
      municipalities: 'all',
      vehicle_types: 'all',
      data_types: ['aanbod', 'verhuringen'],
      issue_owner: 'dashboard_deelmobiliteit',
      note: 'Storing in de importer van Dashboard Deelmobiliteit; data van alle aanbieders ontbreekt.',
      created_by: DEMO_USER,
      created_at: iso(start + 6 * HOUR),
      updated_by: DEMO_USER,
      updated_at: iso(start + 8 * HOUR),
    });
  }

  return rejections;
};
