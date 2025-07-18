import React from 'react';

interface CategoryBarIndicatorProps {
  title: string;
  categories: { value: number; color: string }[];
  max: number;
  unit?: string;
  displayValues?: boolean;
}

export const CategoryBarIndicator: React.FC<CategoryBarIndicatorProps> = ({
  title,
  categories,
  max,
  unit = '',
  displayValues = true,
}) => {
  const titleFontSize = '0.8em';
  const titleFontWeight = 700;
  const valueFontSize = '0.7em';
  const valueFontWeight = 700;
  const barWidth = 180;
  const barHeight = 12;

  // Calculate total value of categories
  const totalValue = categories.reduce((sum, cat) => sum + cat.value, 0);
  // If max is less than total, set max to total
  const dynamicMax = Math.max(max, totalValue);

  // Calculate the width (in %) for each category
  let acc = 0;
  const segments = categories.map((cat, idx) => {
    const start = acc;
    const width = (cat.value / dynamicMax) * 100;
    acc += cat.value;
    return {
      ...cat,
      startPercent: (start / dynamicMax) * 100,
      widthPercent: width,
      idx,
    };
  });

  // If the bar is not full, add a gray segment
  let fillerSegment = null;
  if (acc < dynamicMax) {
    fillerSegment = {
      color: '#E5E6EB',
      startPercent: (acc / dynamicMax) * 100,
      widthPercent: ((dynamicMax - acc) / dynamicMax) * 100,
      idx: 'filler',
      value: dynamicMax - acc,
    };
  }

  return (
    <div style={{ width: barWidth + 40, margin: '0 auto', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, color: '#19213D', marginBottom: 2 }}>{title}</div>
      <div style={{ position: 'relative', width: barWidth, height: barHeight, background: '#E5E6EB', borderRadius: 1, overflow: 'hidden', marginBottom: 2 }}>
        {segments.map(seg => (
          <div
            key={seg.idx}
            style={{
              position: 'absolute',
              left: `${seg.startPercent}%`,
              top: 0,
              height: barHeight,
              width: `${seg.widthPercent}%`,
              background: seg.color,
              borderRadius: 1,
              zIndex: 1,
            }}
          />
        ))}
        {fillerSegment && (
          <div
            key={fillerSegment.idx}
            style={{
              position: 'absolute',
              left: `${fillerSegment.startPercent}%`,
              top: 0,
              height: barHeight,
              width: `${fillerSegment.widthPercent}%`,
              background: fillerSegment.color,
              borderRadius: 1,
              zIndex: 0,
            }}
          />
        )}
      </div>
      {displayValues && (
        <div style={{ position: 'relative', width: barWidth, height: 18, marginTop: 0 }}>
          {segments.map(seg => (
            <div
              key={seg.idx}
              style={{
                position: 'absolute',
                left: `calc(${seg.startPercent + seg.widthPercent / 2}% - 12px)`,
                top: 0,
                width: 24,
                textAlign: 'center',
                color: '#19213D',
                fontSize: valueFontSize,
                fontWeight: valueFontWeight,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {seg.value}
              {unit && <span style={{ fontWeight: 400, fontSize: '0.7em', marginLeft: 2 }}>{unit}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
  