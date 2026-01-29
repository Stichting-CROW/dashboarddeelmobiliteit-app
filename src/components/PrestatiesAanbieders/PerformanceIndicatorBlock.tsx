import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useState } from "react";

interface PerformanceIndicatorBlockProps {
  date: string;
  measured: number;
  threshold?: number;
  complies?: boolean;
}

const getDutchDayAbbreviation = (dateString: string): string => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const dayAbbreviations: Record<number, string> = {
    0: 'zo', // Sunday
    1: 'ma', // Monday
    2: 'di', // Tuesday
    3: 'wo', // Wednesday
    4: 'do', // Thursday
    5: 'vr', // Friday
    6: 'za', // Saturday
  };
  return dayAbbreviations[dayOfWeek] || '';
};

const formatDutchDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long'
  });
};

const PerformanceIndicatorBlock = ({ date, measured, threshold, complies }: PerformanceIndicatorBlockProps) => {
  const [open, setOpen] = useState(false);
  const dayAbbreviation = getDutchDayAbbreviation(date);
  const formattedDate = formatDutchDate(date);

  const getBackgroundColor = (): string => {
    if (complies === true) return 'green';
    if (complies === false) return 'red';
    return 'gray';
  };

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
            style={{ backgroundColor: getBackgroundColor() }}
          />
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          align="center"
          className="max-w-[200px] text-sm whitespace-normal text-left p-2"
        >
          <p className="text-sm leading-tight" dangerouslySetInnerHTML={{
            __html: threshold !== undefined 
              ? `<b>${measured}</b>/${threshold} (${dayAbbreviation}. ${formattedDate})`
              : `<b>${measured}</b> (${dayAbbreviation}. ${formattedDate})`
          }} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};  

export default PerformanceIndicatorBlock;
