import { useState, useEffect } from 'react';
import './Legend.css';

export type LegendItemType = 'added' | 'unchanged' | 'removed';

interface LegendItem {
  type: LegendItemType;
  color: string;
  label: string;
}

const legendItems: LegendItem[] = [
  {
    type: 'added',
    color: '#0f0',
    label: 'Toegevoegd'
  },
  {
    type: 'unchanged',
    color: '#c06427',
    label: 'Onveranderd'
  },
  {
    type: 'removed',
    color: '#f00',
    label: 'Verwijderd'
  }
]

interface LegendProps {
  onActiveTypesChange?: (activeTypes: Set<LegendItemType>) => void;
}

export const Legend = ({ onActiveTypesChange }: LegendProps) => {
  const [activeTypes, setActiveTypes] = useState<Set<LegendItemType>>(
    new Set(legendItems.map(item => item.type))
  );

  useEffect(() => {
    if (onActiveTypesChange) {
      onActiveTypesChange(activeTypes);
    }
  }, [activeTypes, onActiveTypesChange]);

  const toggleType = (type: LegendItemType) => {
    setActiveTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  return <div className="Legend">
    {/* <div className="font-bold">Legenda</div> */}
    <div className="grid grid-cols-3 gap-2">
      {legendItems.map((item) => {
        const isActive = activeTypes.has(item.type);
        return (
          <div 
            key={item.color.replace('#', '')} 
            className="flex flex-row gap-2 items-center cursor-pointer"
            onClick={() => toggleType(item.type)}
          >
            <div className="w-4 h-4" style={{ backgroundColor: item.color }}></div>
            <div className={isActive ? '' : 'line-through'}>{item.label}</div>
          </div>
        );
      })}
    </div>
  </div>
}