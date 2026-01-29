import PerformanceIndicatorBlock from "./PerformanceIndicatorBlock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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

const PerformanceIndicator = ({ kpi, performanceIndicatorDescriptions }: PerformanceIndicatorProps) => {
  const location = useLocation();
  const [urlSearch, setUrlSearch] = useState<string>(window.location.search);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(280);
  
  // Watch for URL changes (triggered by Filterbar using window.history.replaceState)
  useEffect(() => {
    // Update from React Router location first
    setUrlSearch(location.search);
    
    const checkUrlChange = () => {
      const currentSearch = window.location.search;
      setUrlSearch(prevSearch => {
        if (currentSearch !== prevSearch) {
          return currentSearch;
        }
        return prevSearch;
      });
    };

    // Check periodically for URL changes (since replaceState doesn't trigger popstate)
    const interval = setInterval(checkUrlChange, 200);
    
    // Also listen to popstate for back/forward navigation
    window.addEventListener('popstate', checkUrlChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', checkUrlChange);
    };
  }, [location.search]);

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
  
  // Get dates from URL params
  const { startDate, endDate } = useMemo(() => {
    const searchParams = new URLSearchParams(urlSearch);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    
    const start = startDateParam && moment(startDateParam).isValid() 
      ? moment(startDateParam).toDate() 
      : null;
    const end = endDateParam && moment(endDateParam).isValid() 
      ? moment(endDateParam).toDate() 
      : null;
    
    return { startDate: start, endDate: end };
  }, [urlSearch]);
  
  // Filter values based on URL params (or show all if no dates provided)
  const filteredValues = useMemo(() => {
    if (!startDate || !endDate) {
      return kpi.values;
    }
    
    return kpi.values.filter(v => {
      const date = moment(v.date).toDate();
      return date >= startDate && date <= endDate;
    });
  }, [kpi.values, startDate, endDate]);

  // Calculate period in days
  const periodDays = useMemo(() => {
    if (!startDate || !endDate) {
      // If no dates provided, calculate from filtered values
      if (filteredValues.length === 0) return 0;
      const dates = filteredValues.map(v => moment(v.date));
      const minDate = moment.min(dates);
      const maxDate = moment.max(dates);
      return maxDate.diff(minDate, 'days') + 1;
    }
    return moment(endDate).diff(moment(startDate), 'days') + 1;
  }, [startDate, endDate, filteredValues]);

  // Calculate block size dynamically to fit within container
  // Max size: w-4 h-4 (16px), but should shrink if more days
  // Gap between blocks: 4px (gap-1)
  const blockSize = useMemo(() => {
    if (filteredValues.length === 0) return 16;
    const gapSize = 4; // gap-1 = 4px
    const totalGaps = (filteredValues.length - 1) * gapSize;
    const maxBlockSize = Math.floor((containerWidth - totalGaps) / filteredValues.length);
    return Math.min(16, Math.max(4, maxBlockSize)); // Max 16px (w-4 h-4), min 4px for visibility
  }, [filteredValues.length, containerWidth]);

  // Calculate average
  const avgValue = filteredValues.length > 0
    ? (filteredValues.reduce((sum, v) => sum + v.measured, 0) / filteredValues.length).toFixed(1)
    : 0;

  // Find title based on kpi_key
  const description = performanceIndicatorDescriptions.find(desc => desc.kpi_key === kpi.kpi_key);
  const title = description?.title || kpi.kpi_key;

  // Only show blocks if period <= 30 days
  const shouldShowBlocks = periodDays <= 30;

  return (
    <div data-name="performance-indicator" className="flex gap-2">
      <section ref={containerRef} className="flex-1">
        <header>
          <div className="performance-indicator-title font-bold text-xs flex items-center">
            {title}
            <PerformanceIndicatorTooltip description={description?.description} />
          </div>
        </header>
        {shouldShowBlocks && (
          <div className="performance-indicator-blocks mt-1 flex gap-1">
            {filteredValues.map((value, index) => (
              <PerformanceIndicatorBlock
                key={`${value.date}-${index}`}
                date={value.date}
                measured={value.measured}
                threshold={value.threshold}
                complies={value.complies}
                size={blockSize}
              />
            ))}
          </div>
        )}
      </section>
      <section className="font-bold text-xs w-20 text-left text-ellipsis overflow-hidden">
        KPI: -<br />
        Gem.: {avgValue}
      </section>
    </div>
  );
};

export default PerformanceIndicator;
