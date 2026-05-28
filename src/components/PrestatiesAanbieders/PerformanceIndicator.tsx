import PerformanceIndicatorBlock from "./PerformanceIndicatorBlock";
import PerformanceIndicatorBar from "./PerformanceIndicatorBar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import type { PerformanceIndicatorKPI, PerformanceIndicatorDescription } from "../../api/permitLimits";

interface PerformanceIndicatorProps {
  kpi: PerformanceIndicatorKPI;
  performanceIndicatorDescriptions: PerformanceIndicatorDescription[];
}

interface PerformanceIndicatorTooltipProps {
  description?: string;
}

const PerformanceIndicatorTooltip = ({ description }: PerformanceIndicatorTooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <span className="inline-block">
            <InfoCircledIcon className="inline-block ml-1 h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          align="center"
          className="max-w-[200px] text-sm whitespace-normal text-left p-2"
        >
          <p className="text-sm leading-tight font-normal">
            {description || 'Geen beschrijving beschikbaar'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const toDateKey = (date: string): string => moment(date).format('YYYY-MM-DD');

const PerformanceIndicator = ({ kpi, performanceIndicatorDescriptions }: PerformanceIndicatorProps) => {
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(280);

  const startDateParam = searchParams.get('start_date');
  const endDateParam = searchParams.get('end_date');

  // Measure container width for accurate block sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

  // Clamp the values to the URL date range. A stale or cached response can
  // contain dates outside the currently-selected period (e.g. when a default
  // 90-day fetch resolves after a 7-day fetch). Rendering those extra dates
  // produces dozens of indicator blocks for a 7-day period.
  const displayValues = useMemo(() => {
    if (
      !startDateParam ||
      !endDateParam ||
      !moment(startDateParam, 'YYYY-MM-DD', true).isValid() ||
      !moment(endDateParam, 'YYYY-MM-DD', true).isValid()
    ) {
      return kpi.values;
    }

    return kpi.values.filter((value) => {
      const key = toDateKey(value.date);
      return key >= startDateParam && key <= endDateParam;
    });
  }, [kpi.values, startDateParam, endDateParam]);

  // Calculate period in days from URL params or from the values returned by the API
  const periodDays = useMemo(() => {
    if (
      startDateParam &&
      endDateParam &&
      moment(startDateParam, 'YYYY-MM-DD', true).isValid() &&
      moment(endDateParam, 'YYYY-MM-DD', true).isValid()
    ) {
      return moment(endDateParam, 'YYYY-MM-DD').diff(moment(startDateParam, 'YYYY-MM-DD'), 'days') + 1;
    }

    if (displayValues.length === 0) return 0;

    const dateKeys = displayValues.map((value) => toDateKey(value.date)).sort();
    const minDate = moment(dateKeys[0], 'YYYY-MM-DD');
    const maxDate = moment(dateKeys[dateKeys.length - 1], 'YYYY-MM-DD');
    return maxDate.diff(minDate, 'days') + 1;
  }, [startDateParam, endDateParam, displayValues]);

  // Calculate block size dynamically to fit within container
  // Max size: w-4 h-4 (16px), but should shrink if more days
  // Gap between blocks: 4px (gap-1)
  const blockSize = useMemo(() => {
    if (displayValues.length === 0) return 16;
    const gapSize = 4; // gap-1 = 4px
    const totalGaps = (displayValues.length - 1) * gapSize;
    const maxBlockSize = Math.floor((containerWidth - totalGaps) / displayValues.length);
    return Math.min(16, Math.max(4, maxBlockSize)); // Max 16px (w-4 h-4), min 4px for visibility
  }, [displayValues.length, containerWidth]);

  // Calculate average
  const avgValue = displayValues.length > 0
    ? (displayValues.reduce((sum, v) => sum + v.measured, 0) / displayValues.length).toFixed(1)
    : 0;

  // Calculate threshold display value
  const thresholdDisplay = useMemo(() => {
    if (displayValues.length === 0) return '-';
    
    // Get all threshold values (filter out undefined/null)
    const thresholds = displayValues
      .map(v => v.threshold)
      .filter((t): t is number => t !== undefined && t !== null);
    
    // If no thresholds available, show '-'
    if (thresholds.length === 0) return '-';
    
    // Check if all thresholds are the same
    const firstThreshold = thresholds[0];
    const allSame = thresholds.every(t => t === firstThreshold);
    
    if (allSame) {
      return firstThreshold.toString();
    } else {
      return 'div.';
    }
  }, [displayValues]);

  // Find title based on kpi_key
  const description = performanceIndicatorDescriptions.find(desc => desc.kpi_key === kpi.kpi_key);
  const title = description?.title || kpi.kpi_key;

  // Show blocks if period <= 7 days, bar if >= 8 days
  const shouldShowBlocks = periodDays <= 7;
  const shouldShowBar = periodDays >= 8;

  return (
    <div data-name="performance-indicator" className="flex">
      <section ref={containerRef} className="flex gap-4 justify-between flex-1 items-center">
        <header className="flex-1">
          <div className="font-inter text-sm flex items-center flex-1">
            {title}
            <PerformanceIndicatorTooltip description={description?.description} />
          </div>
        </header>
        {shouldShowBlocks && (
          <div className="performance-indicator-blocks flex items-center">
            {displayValues.map((value, index) => (
              <PerformanceIndicatorBlock
                key={`${value.date}-${index}`}
                date={value.date}
                measured={value.measured}
                threshold={value.threshold}
                complies={value.complies}
                size={blockSize}
                isFirst={index === 0}
                isLast={index === displayValues.length - 1}
              />
            ))}
          </div>
        )}
        {shouldShowBar && (
          <div className="performance-indicator-bar-wrapper flex items-center">
            <PerformanceIndicatorBar values={displayValues} />
          </div>
        )}
      </section>
      {/* <section className="font-bold text-xs w-20 text-left text-ellipsis overflow-hidden">
        KPI: {thresholdDisplay}<br />
        Gem.: {avgValue}
      </section> */}
    </div>
  );
};

export default PerformanceIndicator;
