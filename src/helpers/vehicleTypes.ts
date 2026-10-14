
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

/**
 * Returns the plural form of a Dutch vehicle type name
 * @param {string} formFactorName - The singular form factor name (e.g., 'fiets', 'scooter', 'auto')
 * @returns {string} The plural form (e.g., 'fietsen', 'scooters', 'auto's')
 */
export const getPluralFormFactorName = (formFactorName: string): string => {
  if (!formFactorName) {
    return formFactorName;
  }

  const lowerName = formFactorName.toLowerCase();
  
  // Handle specific cases
  if (lowerName === 'auto') {
    return 'auto\'s';
  }
  if (lowerName === 'scooter') {
    return 'scooters';
  }
  if (lowerName === 'brommer') {
    return 'brommers';
  }
  if (lowerName === 'fiets' || lowerName === 'bakfiets') {
    return `${formFactorName}en`;
  }
  
  // Default: add 'en' for words ending in certain patterns, otherwise 's'
  // This is a fallback for any other vehicle types
  if (lowerName.endsWith('fiets')) {
    return `${formFactorName}en`;
  }
  
  // Default to adding 's' for other cases
  return `${formFactorName}s`;
}
