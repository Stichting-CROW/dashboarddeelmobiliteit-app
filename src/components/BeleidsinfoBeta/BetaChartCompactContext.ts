import { createContext, useContext } from 'react';

/** True when the surrounding BetaChartCard is narrow and charts should use the compact layout. */
export const BetaChartCompactContext = createContext(false);

export const useBetaChartCompact = (): boolean => useContext(BetaChartCompactContext);
