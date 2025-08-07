import React from 'react';
import { PERMIT_LIMITS_NIET_ACTIEF } from '../../api/permitLimits';

interface RangeBarIndicatorProps {
  title: string;
  current: number | undefined;
  min?: number;
  max?: number;
  explanation?: string;
  onClick?: () => void;
}

export const RangeBarIndicator: React.FC<RangeBarIndicatorProps> = ({
  title,
  current,
  min,
  max,
  explanation,
  onClick,
}) => {
    const titleFontSize = '0.7em';
    const titleFontWeight = 700;
    const tickFontSize = '0.6em';
    const tickFontWeight = 400;
    const barWidth = 160; // Reduced from 180 to fit smaller cards
    const barHeight = 10; // Reduced from 12 to match smaller scale

    // Handle click event
    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };

   // Check if min/max are "not active" values
   const isMinActive = min !== undefined && min !== PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles;
   const isMaxActive = max !== undefined && max !== PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles;
   
    // If max is set and max > current, use 1.2 * max as the range
    let dynamicMax: number;
    if(current===undefined) {
      dynamicMax=Math.max(max!,min!,100);
    } else if (isMaxActive && max! > current) {
      dynamicMax = Math.max(current, Math.ceil(max! * 1.2));
    } else {
      dynamicMax = Math.max(current, isMaxActive ? max! : current);
    }
    const isInRange = (!isMinActive || current >= min!) && (!isMaxActive || current <= max!);
    const barColor = isInRange ? '#4caf50' : '#f44336';
    const minPercent = isMinActive ? Math.max(0, Math.min(100, (min! / dynamicMax) * 100)) : undefined;
    const maxPercent = isMaxActive ? Math.max(0, Math.min(100, (max! / dynamicMax) * 100)) : undefined;
    const valuePercent = dynamicMax > 0 ? Math.min(100, (current / dynamicMax) * 100) : 0;

    // console.log(`${title} - min: ${minPercent} / max: ${maxPercent} / current: ${valuePercent} / isMinActive: ${isMinActive} / isMaxActive: ${isMaxActive} / dynamicMax: ${dynamicMax} / isInRange: ${isInRange}`);

    return (
      <div 
        style={{ 
          width: barWidth + 20, 
          margin: '0 auto', 
          fontFamily: 'sans-serif', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative'
        }}
        onClick={handleClick}
        title={explanation}
      >
        <div style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, color: '#19213D', marginBottom: 2 }}>{title} ({current?current:' - '})</div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: barWidth, height: barHeight, background: '#E5E6EB', borderRadius: 1, overflow: 'hidden', marginBottom: 2, display: 'flex', alignItems: 'center' }}>
            {isMinActive && (
              <div style={{
                position: 'absolute',
                left: `calc(${minPercent}% - 1px)`,
                top: 0,
                height: barHeight,
                width: 0,
                borderLeft: '2px solid #19213D',
                zIndex: 2,
                pointerEvents: 'none',
              }} />
            )}
            {isMaxActive && max !== 0 && (
              <div style={{
                position: 'absolute',
                left: `calc(${maxPercent}% - 1px)`,
                top: 0,
                height: barHeight,
                width: 0,
                borderLeft: '2px solid #19213D',
                zIndex: 2,
                pointerEvents: 'none',
              }} />
            )}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: barHeight,
                width: `${valuePercent}%`,
                background: barColor,
                borderRadius: 1,
                transition: 'width 0.3s',
                zIndex: 1,
              }}
            />
          </div>
        </div>
        {/* Valid range indicator line */}
        {(isMinActive || isMaxActive) && (
          <div style={{ position: 'relative', width: barWidth, height: 2, marginBottom: 2 }}>
            <div style={{
              position: 'absolute',
              left: isMinActive ? `${minPercent}%` : '0%',
              right: isMaxActive ? `calc(100% - ${maxPercent}%)` : '0%',
              top: 0,
              height: 2,
              background: '#19213D',
              borderRadius: 1,
            }} />
          </div>
        )}
        <div style={{ position: 'relative', height: 14, marginBottom: 0, width: barWidth }}>
          {isMinActive && (
            <div style={{
              position: 'absolute',
              left: `calc(${minPercent}% - 10px)`,
              top: 0,
              textAlign: 'center',
              width: 20,
              color: '#19213D',
              fontSize: tickFontSize,
              fontWeight: tickFontWeight,
              pointerEvents: 'none',
            }}>
              <div style={{ marginBottom: 0 }}>{min!}</div>
            </div>
          )}
          {isMaxActive && max !== 0 && (
            <div style={{
              position: 'absolute',
              left: `calc(${maxPercent}% - 10px)`,
              top: 0,
              textAlign: 'center',
              width: 20,
              color: '#19213D',
              fontSize: tickFontSize,
              fontWeight: tickFontWeight,
              pointerEvents: 'none',
            }}>
              <div style={{ marginBottom: 0 }}>{max!}</div>
            </div>
          )}
        </div>
      </div>
    );
};
  