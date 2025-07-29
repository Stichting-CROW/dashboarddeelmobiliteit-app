import React from 'react';
import { getProvider } from '../../helpers/providers.js';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-xl">
        <div className="text-lg font-semibold mb-4 flex items-center justify-between">
          Selecteer aanbieder
          <button className="text-gray-500 hover:text-gray-700" onClick={onCancel}>✕</button>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          {availableProviders.length === 0 && (
            <div className="text-gray-500">Geen aanbieders beschikbaar</div>
          )}
          {availableProviders.map((provider) => {
            const providerData = getProvider(provider.system_id);
            const providerName = providerData ? providerData.name : provider.system_id;
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
                className="w-32 h-32 flex flex-col items-center justify-center p-4 border rounded shadow hover:bg-gray-100 focus:outline-none"
                onClick={() => onSelect(provider)}
              >
                <img
                  src={providerLogo}
                  alt={`${providerName} logo`}
                  className="w-12 h-12 object-contain mb-2"
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
                <span className="font-medium text-center break-words">{providerName}</span>
              </button>
            );
          })}
        </div>
        <button className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={onCancel}>Annuleren</button>
      </div>
    </div>
  );
};

export default SelectProviderDialog; 