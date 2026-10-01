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

/** Horizontal line showing the maximum capacity of a single selected hub */
export const CAPACITY_KEY = 'Actuele capaciteit';
export const CAPACITY_STROKE = '#DC2626';
export const CAPACITY_DASH = '8 4';
/** Opacity of the red band above the capacity line (over capacity) */
export const CAPACITY_FILL_OPACITY = 0.08;

/** Background band marking weekends on day-level (and finer) x-axes */
export const WEEKEND_FILL = '#0F172A';
export const WEEKEND_FILL_OPACITY = 0.045;
