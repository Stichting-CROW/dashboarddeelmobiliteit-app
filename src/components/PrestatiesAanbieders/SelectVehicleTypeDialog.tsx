import React from 'react';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';

interface SelectVehicleTypeDialogProps {
  onSelect: (vehicleTypeId: string) => void;
  onCancel: () => void;
  vehicleTypes: {id: string, name: string}[];
}

const SelectVehicleTypeDialog: React.FC<SelectVehicleTypeDialogProps> = ({ onSelect, onCancel, vehicleTypes }) => {
  return (
    <div>
      <div className="permits-dialog-grid">
        {vehicleTypes.length === 0 && (
          <div className="permits-dialog-empty-state">Geen voertuigtypes beschikbaar</div>
        )}
        {vehicleTypes.map((vehicleType) => {
          let vehicleLogo = getVehicleIconUrl(vehicleType.id);
          if(!vehicleLogo) {
            vehicleLogo = getVehicleIconUrl('other');
          }
          
          return (
            <button
              key={vehicleType.id}
              className="permits-dialog-button"
              onClick={() => onSelect(vehicleType.id)}
            >
              <img
                src={vehicleLogo}
                alt={`${vehicleType.name} icon`}
                className="permits-vehicle-type-header-img"
              />
              <span className="permits-vehicle-type-header-text">
                {getPrettyVehicleTypeName(vehicleType.id) || vehicleType.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SelectVehicleTypeDialog; 