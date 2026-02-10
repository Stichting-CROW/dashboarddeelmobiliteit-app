import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useState } from "react";

interface PerformanceIndicatorBlockProps {
  date: string;
  measured: number;
  threshold?: number;
  complies?: boolean;
  size?: number; // Size in pixels (default: 16px for w-4 h-4)
  isFirst?: boolean; // Whether this is the first block in the row
  isLast?: boolean; // Whether this is the last block in the row
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

const PerformanceIndicatorBlock = ({ date, measured, threshold, complies, size = 16, isFirst = false, isLast = false }: PerformanceIndicatorBlockProps) => {
  const [open, setOpen] = useState(false);
  const dayAbbreviation = getDutchDayAbbreviation(date);
  const formattedDate = formatDutchDate(date);

  const getBackgroundColor = (): string => {
    if (complies === true) return '#48E248';
    if (complies === false) return '#FD3E48';
    return 'gray';
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <div
            className={`
              performance-indicator-block
              transition-all duration-200 cursor-pointer hover:brightness-125 hover:shadow-lg hover:z-10 relative
              ${isFirst && isLast ? 'mx-0' : isFirst ? 'ml-0 mr-[2.5px]' : isLast ? 'ml-[2.5px] mr-0' : 'mx-[2.5px]'}
            `}
            style={{ 
              backgroundColor: getBackgroundColor(),
              width: `${size}px`,
              height: `${size}px`,
              minWidth: `${size}px`,
              minHeight: `${size}px`,
            }}
          />
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          align="center"
          className="max-w-[200px] text-sm whitespace-normal text-left p-2"
        >
          <p className="text-sm leading-tight" dangerouslySetInnerHTML={{
            __html: threshold !== undefined 
              ? `<b>${measured}</b> / ${threshold}<br />${dayAbbreviation}. ${formattedDate}`
              : `<b>${measured}</b><br />${dayAbbreviation}. ${formattedDate}`
          }} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};  

export default PerformanceIndicatorBlock;
