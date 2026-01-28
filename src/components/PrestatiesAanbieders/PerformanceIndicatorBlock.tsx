import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useState } from "react";

interface PerformanceIndicatorBlockProps {
  date: string;
  measured: number;
}

const PerformanceIndicatorBlock = ({ date, measured }: PerformanceIndicatorBlockProps) => {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <div
            className="performance-indicator-block w-4 h-4 transition-all duration-200 cursor-pointer hover:brightness-125 hover:shadow-lg hover:z-10 relative"
            style={{ backgroundColor: 'gray' }}
          />
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          align="center"
          className="max-w-[200px] text-sm whitespace-normal text-left p-2"
        >
          <p className="text-sm leading-tight" dangerouslySetInnerHTML={{
            __html: `<b>${measured}</b> (${date})`
          }} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};  

export default PerformanceIndicatorBlock;
