import React, { useMemo } from 'react';
import moment from 'moment';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type {
  DataQualityPeriod,
  ManualRejection,
  OperatorDataQuality,
} from '../../types/DataQuality';
import {
  DATA_TYPES,
  DATA_TYPE_LABELS,
  STATUS_COLORS,
  TimelineSegment,
  describeRejectionDataTypes,
  formatDateTime,
  toTimelineSegments,
} from './dataQualityUtils';

interface DataQualityTimelineProps {
  operator: OperatorDataQuality;
  period: DataQualityPeriod;
  now: number;
}

interface LaneProps {
  label: string;
  segments: TimelineSegment[];
  baseColor: string;
  segmentClassName: string;
  futurePct: number;
  renderTooltip: (segment: TimelineSegment, index: number) => React.ReactNode;
}

const formatSegment = (segment: TimelineSegment): string => {
  const end = segment.ongoing ? 'heden' : formatDateTime(segment.end);
  return `${formatDateTime(segment.start)} – ${end}`;
};

const Lane = ({
  label,
  segments,
  baseColor,
  segmentClassName,
  futurePct,
  renderTooltip,
}: LaneProps) => (
  <div className="data-quality-timeline-lane">
    <div className="data-quality-timeline-lane-label">{label}</div>
    <div className="data-quality-timeline-track" style={{ backgroundColor: baseColor }}>
      {futurePct > 0 && (
        <div className="data-quality-timeline-future" style={{ width: `${futurePct}%` }} />
      )}
      {segments.map((segment, index) => (
        <Tooltip key={`${segment.start}-${index}`}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`data-quality-timeline-segment ${segmentClassName}`}
              style={{ left: `${segment.leftPct}%`, width: `${Math.max(segment.widthPct, 0.6)}%` }}
              aria-label={`${label}: ${formatSegment(segment)}`}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-sm whitespace-normal p-2">
            {renderTooltip(segment, index)}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  </div>
);

/** Strip across the selected period with outages per feed and manual-rejection windows. */
const DataQualityTimeline = ({ operator, period, now }: DataQualityTimelineProps) => {
  const futurePct = now < period.end
    ? ((period.end - Math.max(now, period.start)) / (period.end - period.start)) * 100
    : 0;

  const rejectionSegments = useMemo(() => {
    const pairs: { segment: TimelineSegment; rejection: ManualRejection }[] = [];
    operator.rejections.forEach((rejection) => {
      toTimelineSegments([rejection], period, now).forEach((segment) => {
        pairs.push({ segment, rejection });
      });
    });
    return pairs;
  }, [operator.rejections, period, now]);

  return (
    <div className="data-quality-timeline" data-name="indicator-container">
      {DATA_TYPES.map((dataType) => {
        const feed = operator.feeds[dataType];
        const status = feed?.status ?? 'unknown';
        const hasHistory = status === 'available' || status === 'unavailable';
        return (
          <Lane
            key={dataType}
            label={DATA_TYPE_LABELS[dataType]}
            segments={hasHistory ? toTimelineSegments(feed?.outages ?? [], period, now) : []}
            baseColor={hasHistory ? STATUS_COLORS.ok : '#E5E5E5'}
            segmentClassName="data-quality-timeline-segment--outage"
            futurePct={hasHistory ? futurePct : 0}
            renderTooltip={(segment) => (
              <>
                <b>Storing {DATA_TYPE_LABELS[dataType].toLowerCase()}</b>
                <br />
                {formatSegment(segment)}
              </>
            )}
          />
        );
      })}
      <Lane
        label="Afgekeurd"
        segments={rejectionSegments.map(({ segment }) => segment)}
        baseColor="#F0F0F0"
        segmentClassName="data-quality-timeline-segment--rejection"
        futurePct={0}
        renderTooltip={(segment, index) => {
          const rejection = rejectionSegments[index].rejection;
          return (
            <>
              <b>Handmatig afgekeurd</b> ({describeRejectionDataTypes(rejection)})
              <br />
              {formatSegment(segment)}
              {rejection.note && (
                <>
                  <br />
                  {rejection.note}
                </>
              )}
            </>
          );
        }}
      />
      <div className="data-quality-timeline-axis">
        <span>{moment(period.start).format('DD-MM')}</span>
        <span>{moment(period.end - 1).format('DD-MM')}</span>
      </div>
    </div>
  );
};

export default DataQualityTimeline;
