import PerformanceIndicatorBlock from "./PerformanceIndicatorBlock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { PerformanceIndicatorKPI } from "../../api/permitLimits";

interface PerformanceIndicatorProps {
  kpi: PerformanceIndicatorKPI;
}

const PerformanceIndicatorTooltip = () => {
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
          <p className="text-sm leading-tight">
            <a 
              target="_blank" 
              rel="noopener noreferrer"
              href="https://dashboarddeelmobiliteit.nl/docs/Over_het_Dashboard_Deelmobiliteit" 
              className="no-underline text-theme-blue" 
              style={{color: '#15AEEF'}}
              onClick={(e) => e.stopPropagation()}
            >
              Lees de documentatie
            </a>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const PerformanceIndicator = ({ kpi }: PerformanceIndicatorProps) => {
  // Filter values to only show dates 2025-12-16 to 2025-12-20
  const filteredValues = kpi.values.filter(v => {
    const date = new Date(v.date);
    return date >= new Date('2025-12-16') && date <= new Date('2025-12-20');
  });

  // Calculate average
  const avgValue = filteredValues.length > 0
    ? (filteredValues.reduce((sum, v) => sum + v.measured, 0) / filteredValues.length).toFixed(1)
    : 0;

  return (
    <div data-name="performance-indicator" className="flex gap-2">
      <section className="flex-1">
        <header>
          <div className="performance-indicator-title font-bold text-xs flex items-center">
            {kpi.kpi_key}
            <PerformanceIndicatorTooltip />
          </div>
        </header>
        <div className="performance-indicator-blocks flex gap-1">
          {filteredValues.map((value, index) => (
            <PerformanceIndicatorBlock
              key={`${value.date}-${index}`}
              date={value.date}
              measured={value.measured}
            />
          ))}
        </div>
      </section>
      <section className="font-bold text-xs">
        KPI: -<br />
        Gem.: {avgValue}
      </section>
    </div>
  );
};

export default PerformanceIndicator;
