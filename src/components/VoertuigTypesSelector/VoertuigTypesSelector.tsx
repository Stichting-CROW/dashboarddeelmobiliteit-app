import React from 'react';
import './VoertuigTypesSelector.css';

export interface VoertuigType {
  id: string;
  name: string;
}

interface VoertuigTypesSelectorProps {
  voertuigtypes: VoertuigType[];
  excludedTypes: string[];
  onTypeClick: (typeId: string) => void;
  onReset?: () => void;
  showReset?: boolean;
}

function VoertuigTypesSelector({
  voertuigtypes,
  excludedTypes,
  onTypeClick,
  onReset,
  showReset = false
}: VoertuigTypesSelectorProps) {
  const getIconClass = (typeId: string): string => {
    switch(typeId) {
      case "bicycle": return "voertuigtypes-icon-bicycle";
      case "cargo_bicycle": return "voertuigtypes-icon-cargo-bicycle";
      case "moped": return "voertuigtypes-icon-scooter";
      case "car": return "voertuigtypes-icon-car";
      case "unknown": return "voertuigtypes-icon-other";
      default: return "";
    }
  };

  return (
    <div className="w-full voertuigtypes-container">
      {showReset && onReset && (
        <div className="voertuigtypes-title-row">
          <div className="text-right voertuigtypes-reset cursor-pointer" onClick={onReset}>
            reset
          </div>
        </div>
      )}
      <div className="voertuigtypes-box-row">
        {voertuigtypes.map((voertuigtype, idx) => {
          const isExcluded = excludedTypes.includes(voertuigtype.id);
          const baseClassName = `${isExcluded ? "voertuigtypes-item-excluded" : "voertuigtypes-item"}`;
          const extraClass = getIconClass(voertuigtype.id);
          
          return (
            <div 
              className={`flex-1 ${baseClassName}${idx === voertuigtypes.length - 1 ? ' voertuigtypes-item-last' : ''}`} 
              key={voertuigtype.id} 
              onClick={(e) => {
                e.stopPropagation();
                onTypeClick(voertuigtype.id);
              }}
            >
              <div className={`voertuigtypes-icon ${extraClass}`} />
              <div className="voertuigtypes-itemlabel">
                {voertuigtype.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VoertuigTypesSelector; 