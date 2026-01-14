import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface PerformanceIndicatorBlockProps {
  value: number;
  kpi: string;
  success: boolean;
}

const PerformanceIndicatorBlock = ({ value, kpi, success }: PerformanceIndicatorBlockProps) => {
  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="performance-indicator-block w-4 h-4"
            style={{ backgroundColor: success ? 'green' : 'red' }}
          />
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          align="center"
          className="max-w-[200px] text-sm whitespace-normal text-left p-2"
        >
          <p className="text-sm leading-tight">
            {`${value} | ${kpi}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};  

export default PerformanceIndicatorBlock;
