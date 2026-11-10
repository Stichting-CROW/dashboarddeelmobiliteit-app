import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface DataQualityIndicatorProps {
  label: string;
  valueLabel: string;
  color: string;
  detail?: string;
  tooltip?: React.ReactNode;
}

const DataQualityIndicator = ({
  label,
  valueLabel,
  color,
  detail,
  tooltip,
}: DataQualityIndicatorProps) => {
  const row = (
    <div className="data-quality-indicator" tabIndex={tooltip ? 0 : undefined}>
      <div className="min-w-0">
        <div className="data-quality-indicator-label">{label}</div>
        {detail && <div className="data-quality-indicator-detail">{detail}</div>}
      </div>
      <span className="data-quality-indicator-value" style={{ backgroundColor: color }}>
        {valueLabel}
      </span>
    </div>
  );

  if (!tooltip) return row;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-[320px] text-sm whitespace-normal p-2">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export default DataQualityIndicator;
