/**
 * DEMO mode configuration for the Prestaties aanbieders page.
 * When enabled: anonymizes operator names, randomizes colors, applies factors to chart values.
 * Set REACT_APP_DEMO_MODE=true in .env to enable.
 */
export const isDemoMode = (): boolean =>
  typeof process !== 'undefined' &&
  process.env?.REACT_APP_DEMO_MODE === 'true';
