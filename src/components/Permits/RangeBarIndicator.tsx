import React from 'react';

interface RangeBarIndicatorProps {
  title: string;
  current: number;
  min?: number;
  max?: number;
}

export const RangeBarIndicator: React.FC<RangeBarIndicatorProps> = ({
  title,
  current,
  min,
  max,
}) => {
    const titleFontSize = '0.8em';
    const titleFontWeight = 700;
    const tickFontSize = '0.7em';
    const tickFontWeight = 400;
    const currentFontSize = '0.7em';
    const currentFontWeight = 700;
    const barWidth = 180;
    const barHeight = 12; // px
    // If max is set and max > current, use 1.2 * max as the range
    let dynamicMax: number;
    if (max !== undefined && max > current) {
      dynamicMax = Math.max(current, Math.ceil(max * 1.2));
    } else {
      dynamicMax = Math.max(current, max ?? current);
    }
    const isInRange = (min === undefined || current >= min) && (max === undefined || current <= max);
    const barColor = isInRange ? '#4caf50' : '#f44336';
    const minPercent = min !== undefined ? Math.max(0, Math.min(100, (min / dynamicMax) * 100)) : undefined;
    const maxPercent = max !== undefined ? Math.max(0, Math.min(100, (max / dynamicMax) * 100)) : undefined;
    const valuePercent = dynamicMax > 0 ? Math.min(100, (current / dynamicMax) * 100) : 0;

    return (
      <div style={{ width: barWidth + 40, margin: '0 auto', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, color: '#19213D', marginBottom: 2 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: barWidth, height: barHeight, background: '#E5E6EB', borderRadius: 1, overflow: 'hidden', marginBottom: 2, display: 'flex', alignItems: 'center' }}>
            {min !== undefined && (
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
            {max !== undefined && (
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
          <div
            style={{
              marginLeft: 8,
              color: '#19213D',
              fontWeight: currentFontWeight,
              fontSize: currentFontSize,
              whiteSpace: 'nowrap',
              minWidth: 24,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              height: barHeight,
            }}
          >
            {current}
          </div>
        </div>
        <div style={{ position: 'relative', height: 18, marginBottom: 0, width: barWidth }}>
          {min !== undefined && min !== 0 && (
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
              <div style={{ marginBottom: 0 }}>{min}</div>
            </div>
          )}
          {max !== undefined && (
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
              <div style={{ marginBottom: 0 }}>{max}</div>
            </div>
          )}
        </div>
      </div>
    );
};
  