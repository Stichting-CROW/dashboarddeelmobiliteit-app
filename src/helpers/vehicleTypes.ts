
export const getVehicleIconUrl = (vehicleType) => {
  if(vehicleType === 'bicycle') {
    return '/components/MapComponent/vehicle-type-bicycle.svg';
  }
  else if(vehicleType === 'cargo_bicycle') {
    return '/components/MapComponent/vehicle-type-cargo_bicycle.svg';
  }
  else if(vehicleType === 'moped') {
    return '/components/MapComponent/vehicle-type-moped.svg';
  }
  else if(vehicleType === 'car') {
    return '/components/MapComponent/vehicle-type-car.svg';
  }
  else if(vehicleType === 'other') {
    return '/components/MapComponent/vehicle-type-other.svg';
  }
}

export const getPrettyVehicleTypeName = (vehicleType) => {
  if(vehicleType === 'bicycle') {
    return 'fiets';
  }
  else if(vehicleType === 'cargo_bicycle') {
    return 'bakfiets';
  }
  else if(vehicleType === 'moped') {
    return 'scooter';
  }
  else if(vehicleType === 'car') {
    return 'auto';
  }
  else if(vehicleType === 'other') {
    return '';
  }
  else {
    return null;
  }
}
