import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface PerformanceIndicatorBarValue {
  date: string;
  measured: number;
  threshold?: number;
  complies?: boolean;
}

interface PerformanceIndicatorBarProps {
  values: PerformanceIndicatorBarValue[];
}

const BAR_WIDTH = 142;
const BAR_HEIGHT = 16; // Same as block size (w-4 h-4)

const COLORS = {
  red: '#FD3E48',   // complies === false
  green: '#48E248', // complies === true
  white: '#fff',    // complies is neither true nor false
};

const PerformanceIndicatorBar = ({ values }: PerformanceIndicatorBarProps) => {
  const totalCount = values.length;

  const { redCount, greenCount, whiteCount } = values.reduce(
    (acc, v) => {
      if (v.complies === true) acc.greenCount += 1;
      else if (v.complies === false) acc.redCount += 1;
      else acc.whiteCount += 1;
      return acc;
    },
    { redCount: 0, greenCount: 0, whiteCount: 0 }
  );

  const redPercent = totalCount > 0 ? (redCount / totalCount) * 100 : 0;
  const greenPercent = totalCount > 0 ? (greenCount / totalCount) * 100 : 0;
  const whitePercent = totalCount > 0 ? (whiteCount / totalCount) * 100 : 0;

  // Calculate pixel widths; last segment (white) fills remainder to avoid rounding gaps
  const greenWidth = Math.round((greenPercent / 100) * BAR_WIDTH);
  const redWidth = Math.round((redPercent / 100) * BAR_WIDTH);
  const whiteWidth = BAR_WIDTH - greenWidth - redWidth; // Ensure exact total

  const tooltipContent =
    totalCount > 0
      ? `Voldeed goed: ${greenCount} (${greenPercent.toFixed(0)}%)\nVoldeed niet: ${redCount} (${redPercent.toFixed(0)}%)\nOnbekend: ${whiteCount} (${whitePercent.toFixed(0)}%)`
      : 'Geen data in deze periode';

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="performance-indicator-bar flex overflow-hidden rounded-sm cursor-pointer hover:brightness-110 transition-all duration-200 border border-gray-300"
            style={{
              width: `${BAR_WIDTH}px`,
              height: `${BAR_HEIGHT}px`,
              minWidth: `${BAR_WIDTH}px`,
            }}
          >
            {greenWidth > 0 && (
              <div style={{ width: greenWidth, flexShrink: 0, backgroundColor: COLORS.green }} />
            )}
            {redWidth > 0 && (
              <div style={{ width: redWidth, flexShrink: 0, backgroundColor: COLORS.red }} />
            )}
            {whiteWidth > 0 && (
              <div style={{ width: whiteWidth, flexShrink: 0, backgroundColor: COLORS.white }} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-[240px] text-sm whitespace-normal text-left p-2"
        >
          <p className="text-sm leading-tight whitespace-pre-line">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PerformanceIndicatorBar;
