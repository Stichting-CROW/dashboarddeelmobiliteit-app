import PerformanceIndicatorBlock from "./PerformanceIndicatorBlock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";
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
  // Filter values to only show dates 2025-12-16 to 2025-12-20
  const filteredValues = kpi.values.filter(v => {
    const date = new Date(v.date);
    return date >= new Date('2025-12-16') && date <= new Date('2025-12-20');
  });

  // Calculate average
  const avgValue = filteredValues.length > 0
    ? (filteredValues.reduce((sum, v) => sum + v.measured, 0) / filteredValues.length).toFixed(1)
    : 0;

  // Find title based on kpi_key
  const description = performanceIndicatorDescriptions.find(desc => desc.kpi_key === kpi.kpi_key);
  const title = description?.title || kpi.kpi_key;

  return (
    <div data-name="performance-indicator" className="flex gap-2">
      <section className="flex-1">
        <header>
          <div className="performance-indicator-title font-bold text-xs flex items-center">
            {title}
            <PerformanceIndicatorTooltip description={description?.description} />
          </div>
        </header>
        <div className="performance-indicator-blocks mt-1 flex gap-1">
          {filteredValues.map((value, index) => (
            <PerformanceIndicatorBlock
              key={`${value.date}-${index}`}
              date={value.date}
              measured={value.measured}
            />
          ))}
        </div>
      </section>
      <section className="font-bold text-xs w-20 text-left text-ellipsis overflow-hidden">
        KPI: -<br />
        Gem.: {avgValue}
      </section>
    </div>
  );
};

export default PerformanceIndicator;
