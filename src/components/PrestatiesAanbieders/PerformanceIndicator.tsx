import PerformanceIndicatorBlock from "./PerformanceIndicatorBlock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

interface PerformanceIndicatorProps {
  title: string;
}

const blocks = [
  {
    value: 100,
    kpi: '> 100',
    success: true,
  },
  {
    value: 200,
    kpi: '> 100',
    success: false,
  },
  {
    value: 300,
    kpi: '> 100',
    success: true,
  },
]

const kpiValue = '< 100';
const avgValue = 300;

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

const PerformanceIndicator = ({ title }: PerformanceIndicatorProps) => {
  return (
    <div data-name="performance-indicator" className="flex gap-2">
      <section className="flex-1">
        <header>
          <div className="performance-indicator-title font-bold text-xs flex items-center">
            {title}
            <PerformanceIndicatorTooltip />
          </div>
        </header>
        <div className="performance-indicator-blocks flex gap-1">
          {blocks.map((block) => (
            <PerformanceIndicatorBlock
              key={block.kpi}
              value={block.value}
              kpi={block.kpi}
              success={block.success}
            />
          ))}
        </div>
      </section>
      <section className="font-bold text-xs">
        KPI: {kpiValue}<br />
        Gem.: {avgValue}
      </section>
    </div>
  );
};

export default PerformanceIndicator;
