import React from 'react';

interface ProviderLabelProps {
  label: string;
  color: string;
}

/**
 * HTML snippet used in map popups (for maplibre's setHTML).
 * Kept here so both the map popup and the React component share the same structure.
 */
export const buildProviderLabelHtml = (label: string, color: string): string => `
          <h1 class="mb-2">
            <span
              class="rounded-full inline-block w-4 h-4"
              style="background-color: ${color};position: relative;"
              onClick="window.showConfetti()"
              >
            </span>
            <span class="Map-popup-title ml-2" style="color: ${color};">
              ${label}
            </span>
          </h1>
`;

/**
 * Provider label styled to match the map popup title (colored dot + colored title text).
 * Used inside React components (cards etc.).
 */
const ProviderLabel: React.FC<ProviderLabelProps> = ({ label, color }) => {
  const handleConfettiClick = () => {
    // Only trigger if the global confetti helper exists (it is registered in map popups)
    if (typeof window !== 'undefined' && (window as any).showConfetti) {
      (window as any).showConfetti();
    }
  };

  return (
    <div className="permits-card-label mb-2 flex items-center">
      <span
        className="rounded-full inline-block w-4 h-4"
        style={{ backgroundColor: color, position: 'relative' }}
        onClick={handleConfettiClick}
      />
      <span className="Map-popup-title ml-2" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

export default ProviderLabel;

