/**
 * Demo data for the interactive widgets on the features page.
 * All data is generated locally: no API calls, no Redux, no real operator names.
 */

export interface DemoOperator {
  system_id: string;
  name: string;
  color: string;
}

/** Fictional operators, in the same style as the demo mode name/color pools. */
export const demoOperators: DemoOperator[] = [
  { system_id: 'deelfiets_noord', name: 'Deelfiets Noord', color: '#E63946' },
  { system_id: 'stadsfiets_nederland', name: 'Stadsfiets Nederland', color: '#457B9D' },
  { system_id: 'groene_mobiliteit', name: 'Groene Mobiliteit', color: '#2A9D8F' }
];

/** Parkeerduur bins as used by the Aanbod map legend. */
export const durationBins = [
  { bin: 0, color: '#1FA024', label: '< 2 dagen' },
  { bin: 1, color: '#48E248', label: '< 4 dagen' },
  { bin: 2, color: '#FFD837', label: '< 7 dagen' },
  { bin: 3, color: '#FD3E48', label: '< 14 dagen' },
  { bin: 4, color: '#9158DE', label: '>= 14 dagen' }
] as const;

/** Weena / Rotterdam Centraal area, used as the center for all demo maps. */
export const demoMapCenter: [number, number] = [4.4695, 51.9235];

export interface DemoVehicleProperties {
  vehicle_id: string;
  system_id: string;
  operator_name: string;
  form_factor: string;
  duration_bin: number;
  duration_label: string;
  is_non_operational: boolean;
}

export type DemoVehiclesGeoJson = {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: DemoVehicleProperties;
    geometry: { type: 'Point'; coordinates: [number, number] };
  }[];
};

/**
 * Deterministic pseudo random generator, so every visitor sees the same
 * demo situation and the maps don't jump around between renders.
 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

const formFactors = ['bicycle', 'moped', 'cargo_bicycle'];

/**
 * Clusters of vehicles around a few streets and hubs near Weena, so the
 * heatmap shows recognisable hotspots instead of an even spread.
 */
const vehicleClusters: { center: [number, number]; count: number; spread: number }[] = [
  { center: [4.4695, 51.9235], count: 34, spread: 0.0016 }, // Weena / Centraal
  { center: [4.4738, 51.9198], count: 26, spread: 0.0014 }, // Lijnbaan
  { center: [4.4636, 51.9222], count: 18, spread: 0.0012 }, // Kruisplein
  { center: [4.4790, 51.9245], count: 16, spread: 0.0018 }, // Hofplein
  { center: [4.4665, 51.9165], count: 14, spread: 0.0020 }, // Eendrachtsplein
  { center: [4.4772, 51.9160], count: 12, spread: 0.0022 } // Blaak
];

/** Weighted duration bins: most vehicles are rented within a few days. */
const durationBinWeights = [0.45, 0.24, 0.15, 0.1, 0.06];

function pickDurationBin(random: () => number): number {
  const value = random();
  let cumulative = 0;
  for (let bin = 0; bin < durationBinWeights.length; bin++) {
    cumulative += durationBinWeights[bin];
    if (value <= cumulative) return bin;
  }
  return durationBinWeights.length - 1;
}

/**
 * Vehicles in the Weena area, with the same properties the real Aanbod
 * layers expect: system_id, duration_bin and is_non_operational.
 */
export function getDemoVehiclesGeoJson(): DemoVehiclesGeoJson {
  const random = createRandom(20240816);
  const features: DemoVehiclesGeoJson['features'] = [];

  vehicleClusters.forEach((cluster, clusterIndex) => {
    for (let i = 0; i < cluster.count; i++) {
      const operator = demoOperators[Math.floor(random() * demoOperators.length)];
      const durationBin = pickDurationBin(random);
      // Latitude spread is halved so clusters look round instead of stretched.
      const lng = cluster.center[0] + (random() - 0.5) * cluster.spread * 2;
      const lat = cluster.center[1] + (random() - 0.5) * cluster.spread;

      features.push({
        type: 'Feature',
        properties: {
          vehicle_id: `demo-${clusterIndex}-${i}`,
          system_id: operator.system_id,
          operator_name: operator.name,
          form_factor: formFactors[Math.floor(random() * formFactors.length)],
          duration_bin: durationBin,
          duration_label: durationBins[durationBin].label,
          is_non_operational: random() < 0.12
        },
        geometry: {
          type: 'Point',
          coordinates: [
            Number(lng.toFixed(6)),
            Number(lat.toFixed(6))
          ]
        }
      });
    }
  });

  return { type: 'FeatureCollection', features };
}

export function getDemoDefectVehiclesGeoJson(): DemoVehiclesGeoJson {
  const all = getDemoVehiclesGeoJson();
  return {
    type: 'FeatureCollection',
    features: all.features.filter((x) => x.properties.is_non_operational)
  };
}

export interface DemoChartRow {
  time: string;
  [operatorKey: string]: string | number;
}

/**
 * Occupancy per quarter of an hour for one weekday in a single hub.
 * The curve follows a typical city hub: full at night, emptying during the
 * morning peak, partly refilled during the day and busy again in the evening.
 */
export function getDemoOntwikkelingData(): DemoChartRow[] {
  const random = createRandom(984213);
  const rows: DemoChartRow[] = [];

  // Base occupancy per hour of the day, per operator (index = operator order).
  const hourlyProfiles: number[][] = [
    // 0    1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23
    [12, 12, 12, 11, 11, 10, 8, 5, 3, 4, 5, 6, 6, 5, 5, 4, 4, 5, 7, 9, 11, 12, 13, 13],
    [8, 8, 8, 8, 7, 7, 6, 4, 2, 3, 4, 4, 5, 4, 4, 3, 3, 4, 5, 7, 8, 9, 9, 8],
    [5, 5, 5, 5, 5, 4, 4, 2, 1, 2, 2, 3, 3, 3, 2, 2, 2, 3, 4, 5, 6, 6, 6, 5]
  ];

  for (let quarter = 0; quarter < 96; quarter++) {
    const hour = Math.floor(quarter / 4);
    const nextHour = (hour + 1) % 24;
    const withinHour = (quarter % 4) / 4;

    const row: DemoChartRow = {
      time: `${String(hour).padStart(2, '0')}:${String((quarter % 4) * 15).padStart(2, '0')}`
    };

    demoOperators.forEach((operator, index) => {
      const profile = hourlyProfiles[index];
      // Interpolate between hours so the line is smooth on quarter level.
      const interpolated =
        profile[hour] + (profile[nextHour] - profile[hour]) * withinHour;
      const noise = (random() - 0.5) * 1.4;
      row[operator.system_id] = Math.max(0, Math.round(interpolated + noise));
    });

    row['Totaal'] = demoOperators.reduce(
      (sum, operator) => sum + (Number(row[operator.system_id]) || 0),
      0
    );

    rows.push(row);
  }

  return rows;
}
