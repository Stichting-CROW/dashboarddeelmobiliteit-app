import React, { useCallback, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface DataQualityIndicatorProps {
  label: string;
  valueLabel: string;
  color: string;
  subtitle?: string;
  detail?: string;
  tooltip?: React.ReactNode;
  /** Makes the value pill clickable; receives a callback that closes the popover. */
  renderValuePopover?: (close: () => void) => React.ReactNode;
  valuePopoverLabel?: string;
}

const DataQualityIndicator = ({
  label,
  valueLabel,
  color,
  subtitle,
  detail,
  tooltip,
  renderValuePopover,
  valuePopoverLabel,
}: DataQualityIndicatorProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const closePopover = useCallback(() => setPopoverOpen(false), []);

  const pill = renderValuePopover ? (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="data-quality-indicator-value data-quality-indicator-value--clickable"
          style={{ backgroundColor: color }}
          aria-label={valuePopoverLabel ? `${valueLabel}: ${valuePopoverLabel}` : undefined}
        >
          {valueLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="data-quality-popover">
        {renderValuePopover(closePopover)}
      </PopoverContent>
    </Popover>
  ) : (
    <span className="data-quality-indicator-value" style={{ backgroundColor: color }}>
      {valueLabel}
    </span>
  );

  const labelBlock = (
    <div className="min-w-0" tabIndex={tooltip ? 0 : undefined}>
      <div className="data-quality-indicator-label">{label}</div>
      {subtitle && <div className="data-quality-indicator-subtitle">{subtitle}</div>}
      {detail && <div className="data-quality-indicator-detail">{detail}</div>}
    </div>
  );

  return (
    <div className="data-quality-indicator">
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{labelBlock}</TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="max-w-[320px] text-sm whitespace-normal p-2"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        labelBlock
      )}
      {pill}
    </div>
  );
};

export default DataQualityIndicator;
