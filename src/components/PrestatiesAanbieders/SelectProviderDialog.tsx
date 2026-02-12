import React from 'react';
import { getProvider } from '../../helpers/providers.js';
import { isDemoMode } from '../../config/demo';
import { getDemoOperatorName } from '../../helpers/demoMode';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import type { OperatorData } from '../../api/operators';

interface SelectProviderDialogProps {
  modality: string | null;
  availableProviders: OperatorData[];
  onSelect: (provider: OperatorData) => void;
  onCancel: () => void;
}

const SelectProviderDialog: React.FC<SelectProviderDialogProps> = ({ modality, availableProviders, onSelect, onCancel }) => {
  // Only return null if modality is explicitly provided and is falsy
  // For the main add workflow, modality is null but we still want to show the dialog
  if (modality !== null && !modality) return null;

  return (
    <div>
      <div className="permits-dialog-grid">
        {availableProviders.length === 0 && (
          <div className="permits-dialog-empty-state">Geen aanbieders beschikbaar</div>
        )}
        {availableProviders.map((provider) => {
          const providerData = getProvider(provider.system_id);
          const realName = providerData ? providerData.name : provider.system_id;
          const providerName = isDemoMode() ? getDemoOperatorName(provider.system_id) : realName;
          const providerLogo = providerData && providerData.logo ? providerData.logo : createSvgPlaceholder({
            width: 48,
            height: 48,
            text: providerName.slice(0, 2),
            bgColor: '#0F1C3F',
            textColor: '#7FDBFF',
          });
          return (
            <button
              key={provider.system_id}
              className="permits-dialog-button"
              onClick={() => onSelect(provider)}
            >
              <img
                src={providerLogo}
                alt={`${providerName} logo`}
                className="permits-vehicle-type-header-img"
                onError={(e) => {
                  e.currentTarget.src = createSvgPlaceholder({
                    width: 48,
                    height: 48,
                    text: providerName.slice(0, 2),
                    bgColor: '#0F1C3F',
                    textColor: '#7FDBFF',
                  });
                }}
              />
              <span className="permits-dialog-button-text">{providerName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SelectProviderDialog; 