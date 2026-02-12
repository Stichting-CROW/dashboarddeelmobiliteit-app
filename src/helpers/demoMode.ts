/**
 * Demo mode helpers for the Prestaties aanbieders page.
 * Provides consistent anonymized names, colors, and value factors across navigation and reloads.
 * Uses localStorage to persist generated values.
 */

import { isDemoMode } from '../config/demo';

const DEMO_STORAGE_KEY = 'demo_prestaties_config_v1';

/** Seeded random: same seed always yields same value */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

interface DemoConfig {
  operatorNames: Record<string, string>;
  operatorColors: Record<string, string>;
  valueFactors: Record<string, number>;
}

/** Dutch shared mobility company-like names for demo */
const DEMO_OPERATOR_NAMES_POOL = [
  'Deelfiets Noord',
  'Stadsfiets Nederland',
  'Groene Mobiliteit',
  'FietsDeel BV',
  'ScootShare',
  'Stedelijk Vervoer',
  'Mobiliteitshub',
  'FietsNet Holland',
  'StadsDeel',
  'Mobiel Nederland',
  'DeelScooter',
  'Fiets & Go',
  'Urban Wheels',
  'Stadfiets',
  'Deelmobiel',
  'StadsMobiliteit',
];

/** Distinct colors for demo (avoid real operator colors) */
const DEMO_COLORS_POOL = [
  '#E63946', '#457B9D', '#2A9D8F', '#E9C46A',
  '#F4A261', '#9B5DE5', '#00B4D8', '#7209B7',
  '#3A86FF', '#06D6A0', '#EF476F', '#118AB2',
  '#073B4C', '#FB5607', '#8338EC', '#FF006E',
];

/** Value factors pool (some multiply, some divide) */
const VALUE_FACTORS_POOL = [1 / 1.4, 1.4, 1 / 1.2, 1.2, 1 / 1.6, 1.6];

function getOrCreateDemoConfig(): DemoConfig {
  if (typeof window === 'undefined') {
    return { operatorNames: {}, operatorColors: {}, valueFactors: {} };
  }

  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as DemoConfig;
    }
  } catch {
    /* ignore parse errors */
  }

  const config: DemoConfig = {
    operatorNames: {},
    operatorColors: {},
    valueFactors: {},
  };

  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(config));
  return config;
}

/** Initialize config with values for all known system_ids (called when we first see one) */
function ensureOperatorInConfig(systemId: string, config: DemoConfig): void {
  if (config.operatorNames[systemId] && config.operatorColors[systemId]) return;

  const seed = systemId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  if (!config.operatorNames[systemId]) {
    const idx = Math.floor(seededRandom(seed) * DEMO_OPERATOR_NAMES_POOL.length);
    config.operatorNames[systemId] = DEMO_OPERATOR_NAMES_POOL[idx];
  }

  if (!config.operatorColors[systemId]) {
    const idx = Math.floor(seededRandom(seed + 1) * DEMO_COLORS_POOL.length);
    config.operatorColors[systemId] = DEMO_COLORS_POOL[idx];
  }
}

/** Initialize value factor for a kpi_key */
function ensureValueFactorInConfig(kpiKey: string, config: DemoConfig): void {
  if (config.valueFactors[kpiKey]) return;

  const seed = kpiKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const idx = Math.floor(seededRandom(seed) * VALUE_FACTORS_POOL.length);
  config.valueFactors[kpiKey] = VALUE_FACTORS_POOL[idx];
}

function saveConfig(config: DemoConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

/**
 * Get demo operator name for system_id. Consistent across reloads.
 */
export function getDemoOperatorName(systemId: string): string {
  const config = getOrCreateDemoConfig();
  ensureOperatorInConfig(systemId, config);
  saveConfig(config);
  return config.operatorNames[systemId] || systemId;
}

/**
 * Get demo provider color for system_id. Consistent across reloads.
 */
export function getDemoProviderColor(systemId: string): string {
  const config = getOrCreateDemoConfig();
  ensureOperatorInConfig(systemId, config);
  saveConfig(config);
  return config.operatorColors[systemId] || '#666';
}

/**
 * Get display name for operator: demo name when demo mode, else real name.
 */
export function getDisplayOperatorName(
  systemId: string,
  realName: string | undefined,
  useDemo: boolean
): string {
  if (!useDemo) return realName || systemId || 'onbekende aanbieder';
  return getDemoOperatorName(systemId);
}

/**
 * Get display color for operator: demo color when demo mode, else real color.
 */
export function getDisplayProviderColor(systemId: string, realColor: string, useDemo: boolean): string {
  if (!useDemo) return realColor;
  return getDemoProviderColor(systemId);
}

/**
 * Apply demo value factor to a numeric value (for chart data).
 * Only applies when demo mode is on. KPI threshold and compliance are NOT altered.
 */
export function applyDemoValueFactor(value: number, kpiKey: string): number {
  if (!isDemoMode()) return value;

  const config = getOrCreateDemoConfig();
  ensureValueFactorInConfig(kpiKey, config);
  saveConfig(config);

  const factor = config.valueFactors[kpiKey] ?? 1;
  return value * factor;
}
