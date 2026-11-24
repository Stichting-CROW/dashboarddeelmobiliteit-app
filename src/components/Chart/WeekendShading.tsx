import React from 'react';
import moment from 'moment';
import {Customized} from 'recharts';

import {WEEKEND_FILL, WEEKEND_FILL_OPACITY} from './chartConstants';

/** Inclusive range of row indexes that fall in a weekend */
export interface IndexRange {
  start: number;
  end: number;
}

/** Aggregation levels where a single interval never spans more than one day */
const INTRA_DAY_LEVELS = ['5m', '15m', 'hour', 'day'];

/**
 * Finds the contiguous weekend stretches in prepared chart data. Rows must
 * still carry their original timestamp in `time` or `name`. Returns nothing
 * for week/month intervals, where a weekend cannot be marked.
 */
export const getWeekendRanges = (
  rows: Array<Record<string, unknown>> | null | undefined,
  aggregationLevel: string
): IndexRange[] => {
  if (!rows?.length || !INTRA_DAY_LEVELS.includes(aggregationLevel)) return [];

  const ranges: IndexRange[] = [];
  let current: IndexRange | null = null;

  rows.forEach((row, index) => {
    const timestamp = moment((row.time ?? row.name) as string);
    const isWeekend = timestamp.isValid() && timestamp.isoWeekday() >= 6;
    if (isWeekend) {
      if (current) current.end = index;
      else current = {start: index, end: index};
    } else if (current) {
      ranges.push(current);
      current = null;
    }
  });
  if (current) ranges.push(current);

  return ranges;
};

interface WeekendShadingLayerProps {
  ranges: IndexRange[];
  /** Injected by Recharts through <Customized /> */
  xAxisMap?: Record<string, any>;
  offset?: {left: number; top: number; width: number; height: number};
}

/**
 * Draws one translucent band per weekend range, each spanning from half an
 * interval before the first weekend tick to half an interval after the last.
 */
function WeekendShadingLayer({ranges, xAxisMap, offset}: WeekendShadingLayerProps) {
  const xAxis = xAxisMap ? Object.values(xAxisMap)[0] : null;
  if (!xAxis?.scale || !offset || !ranges.length) return null;

  const scale = xAxis.scale;
  const domain: unknown[] = scale.domain();
  if (domain.length === 0) return null;

  // Distance between two adjacent ticks. Point scales expose step(); fall
  // back to the difference between the first two ticks, or the full plot
  // width when there is only one data point.
  const step =
    typeof scale.step === 'function' && domain.length > 1
      ? scale.step()
      : domain.length > 1
        ? Math.abs(scale(domain[1]) - scale(domain[0]))
        : offset.width;

  const plotLeft = offset.left;
  const plotRight = offset.left + offset.width;

  return (
    <g className="recharts-weekend-shading" pointerEvents="none">
      {ranges.map((range) => {
        if (range.start >= domain.length) return null;
        const end = Math.min(range.end, domain.length - 1);
        const left = Math.max(plotLeft, scale(domain[range.start]) - step / 2);
        const right = Math.min(plotRight, scale(domain[end]) + step / 2);
        if (right <= left) return null;
        return (
          <rect
            key={`weekend-${range.start}`}
            x={left}
            y={offset.top}
            width={right - left}
            height={offset.height}
            fill={WEEKEND_FILL}
            fillOpacity={WEEKEND_FILL_OPACITY}
          />
        );
      })}
    </g>
  );
}

/**
 * Returns the Recharts child that shades weekends, or null when there is
 * nothing to shade. Place it before the grid and series so it renders behind
 * them. Must be used as a direct child of a Recharts chart, because Recharts
 * only recognises its own element types.
 */
export const renderWeekendShading = (ranges: IndexRange[]) =>
  ranges.length > 0 ? (
    <Customized key="weekend-shading" component={<WeekendShadingLayer ranges={ranges} />} />
  ) : null;
