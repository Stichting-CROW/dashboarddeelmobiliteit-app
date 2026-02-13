import React from 'react';

export const PROPULSION_EMOJI: Record<string, string> = {
  electric: ' ⚡',
  combustion: ' 🛢️',
  electric_assist: ' ⚡',
};

export const PROPULSION_TITLE: Record<string, string> = {
  electric: 'elektrisch',
  combustion: 'verbrandingsmotor',
  electric_assist: 'elektrisch ondersteund',
};

interface ProviderLabelProps {
  label: string;
  color: string;
  /** When set, appends emoji with tooltip (⚡/🛢️) */
  propulsionType?: string;
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
const ProviderLabel: React.FC<ProviderLabelProps> = ({ label, color, propulsionType }) => {
  const handleConfettiClick = () => {
    // Only trigger if the global confetti helper exists (it is registered in map popups)
    if (typeof window !== 'undefined' && (window as any).showConfetti) {
      (window as any).showConfetti();
    }
  };

  const emoji = propulsionType && PROPULSION_EMOJI[propulsionType];
  const tooltip = propulsionType && PROPULSION_TITLE[propulsionType];

  return (
    <div className="permits-card-label flex items-center">
      <span
        className="rounded-full inline-block w-4 h-4"
        style={{ backgroundColor: color, position: 'relative' }}
        onClick={handleConfettiClick}
      />
      <span className="Map-popup-title ml-2" style={{ color }}>
        {label}
        {emoji && tooltip && (
          <span title={tooltip} className="inline-block text-base leading-none ml-0.5">{emoji}</span>
        )}
      </span>
    </div>
  );
};

export default ProviderLabel;

