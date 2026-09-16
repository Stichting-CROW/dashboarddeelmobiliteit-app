/**
 * Shared constants for the statistics charts on /stats/beleidsinfo.
 */

/** Charts with the same syncId show their tooltip at the same x position when hovering one of them */
export const CHART_SYNC_ID = 'beleidsinfo';

/** Styling of the summed "Totaal" series, dashed so it stands apart from provider colors */
export const TOTAAL_STROKE = '#1a1a1a';
export const TOTAAL_DASH = '6 4';

/** Data key of the summed series */
export const TOTAAL_KEY = 'Totaal';

/** "Ghost" line showing the total of the previous period of equal length */
export const PREVIOUS_TOTAAL_KEY = 'Totaal vorige periode';
export const PREVIOUS_TOTAAL_STROKE = '#9CA3AF';
export const PREVIOUS_TOTAAL_DASH = '2 4';

/** Background band marking weekends on day-level (and finer) x-axes */
export const WEEKEND_FILL = '#0F172A';
export const WEEKEND_FILL_OPACITY = 0.045;
