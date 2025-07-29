import React from 'react';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';

interface SelectVehicleTypeDialogProps {
  onSelect: (vehicleTypeId: string) => void;
  onCancel: () => void;
  vehicleTypes: {id: string, name: string}[];
}

const SelectVehicleTypeDialog: React.FC<SelectVehicleTypeDialogProps> = ({ onSelect, onCancel, vehicleTypes }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-xl">
        <div className="text-lg font-semibold mb-4 flex items-center justify-between">
          Selecteer voertuigtype
          <button className="text-gray-500 hover:text-gray-700" onClick={onCancel}>✕</button>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          {vehicleTypes.length === 0 && (
            <div className="text-gray-500">Geen voertuigtypes beschikbaar</div>
          )}
          {vehicleTypes.map((vehicleType) => {
            let vehicleLogo = getVehicleIconUrl(vehicleType.id);
            if(!vehicleLogo) {
              vehicleLogo = getVehicleIconUrl('other');
            }
            
            return (
              <button
                key={vehicleType.id}
                className="w-32 h-32 flex flex-col items-center justify-center p-4 border rounded shadow hover:bg-gray-100 focus:outline-none"
                onClick={() => onSelect(vehicleType.id)}
              >
                <img
                  src={vehicleLogo}
                  alt={`${vehicleType.name} icon`}
                  className="w-12 h-12 object-contain mb-2"
                />
                <span className="font-medium text-center break-words">
                  {getPrettyVehicleTypeName(vehicleType.id) || vehicleType.name}
                </span>
              </button>
            );
          })}
        </div>
        <button className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={onCancel}>Annuleren</button>
      </div>
    </div>
  );
};

export default SelectVehicleTypeDialog; 