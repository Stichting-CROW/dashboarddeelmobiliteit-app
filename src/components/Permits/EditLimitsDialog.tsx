import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { getVehicleIconUrl, getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { getPermitLimitHistory, PERMIT_LIMITS_NIET_ACTIEF, PermitLimitData } from '../../api/permitLimits';
import { getProvider } from '../../helpers/providers'; // TODO: use operators from parent component (has no logo info now)
interface EditLimitsDialogProps {
  token: string;
  municipality: string;
  provider_system_id: string;
  vehicle_type: string;
  mode: 'normal' | 'admin';
  onOk: (formData: PermitLimitData) => void;
  onCancel: () => void;
}
const isNumber = (v: any) => typeof v === 'number' && !isNaN(v);
// Parse ISO8601 duration to number of days (hours rounded down)
const isoDurationToDays = (duration: string | undefined): number | false => {
  if(!duration) return false;
  // Example: P1Y2M3W4DT5H6M7S
  const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
  const match = duration.match(regex);
  if (!match) return false;

  const [
    ,
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
  ] = match.map((v) => (v ? parseInt(v, 10) : 0));

  // Convert all to days, hours/minutes/seconds as fractions
  let totalDays =
    (years || 0) * 365 +
    (months || 0) * 30 +
    (weeks || 0) * 7 +
    (days || 0);

  // Add fractional days from time part
  if (hours || minutes || seconds) {
    const dayFraction =
      (hours || 0) / 24 +
      (minutes || 0) / 1440 +
      (seconds || 0) / 86400;
    totalDays += Math.floor(dayFraction);
  }

  return totalDays;
};

// Convert number of days to ISO8601 duration (PXD)
const daysToIsoDuration = (days: number): string => {
  return `P${Math.floor(days)}D`;
};

const EditLimitsDialog: React.FC<EditLimitsDialogProps> = ({ token, municipality, provider_system_id, vehicle_type, mode, onOk, onCancel }) => {
  // Initial date logic
  const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState<string>(tomorrow);

  const [permitHistory, setPermitHistory] = useState<PermitLimitData[]|null>(null);
  const [currentRecord, setCurrentRecord] = useState<PermitLimitData|null>(null);

  // Add state for all fields
  const [minimumVehicules, setMinimumVehicules] = useState<number | ''>('');
  const [maximumVehicules, setMaximumVehicules] = useState<number | ''>('');
  const [maxParkingDuration, setMaxParkingDuration] = useState<number | ''>('');
  const [minimalNumberOfTripsPerVehicle, setMinimalNumberOfTripsPerVehicle] = useState<number | ''>('');

  // Add state for 'actief' checkboxes for each field
  const [minimumVehiculesActive, setMinimumVehiculesActive] = useState(true);
  const [maximumVehiculesActive, setMaximumVehiculesActive] = useState(true);
  const [maxParkingDurationActive, setMaxParkingDurationActive] = useState(true);
  const [minimalNumberOfTripsPerVehicleActive, setMinimalNumberOfTripsPerVehicleActive] = useState(true);

  // Fetch current record on mount and when startDate changes
  useEffect(() => {
    getPermitLimitHistory(token, municipality, provider_system_id, vehicle_type).then(history=>{
      if(null === history) {
        setPermitHistory(null);
      } else {
        setPermitHistory(history.sort((a, b) => moment(a.effective_date).diff(moment(b.effective_date))));
      }
    });
  }, [municipality, provider_system_id, vehicle_type, token]);  

  useEffect(() => {
    if(permitHistory) {
      let data: PermitLimitData|null = null;
      for(let i = 0; i < permitHistory.length; i++) {
        const startdate = permitHistory[i].effective_date;
        const enddate = i<permitHistory.length-1 ? permitHistory[i+1].effective_date: '9999-12-31';
        if(selectedDate >= startdate && selectedDate <= enddate) {
          data = permitHistory[i];
          break;
        }
      }

      setCurrentRecord(data);

      setMinimumVehiculesActive(data!==null && data.minimum_vehicles !== PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles);
      setMaximumVehiculesActive(data!==null && data.maximum_vehicles !== PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles);
      setMaxParkingDurationActive(data!==null && isoDurationToDays(data.max_parking_duration) !== isoDurationToDays(PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration));
      setMinimalNumberOfTripsPerVehicleActive(data!==null && data.minimal_number_of_trips_per_vehicle !== PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle);
    } 
  }, [permitHistory, selectedDate]);

  const handleSelectedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const getNewData = () => {
    // Compute current values with actief logic, using original value if edit box is empty
    const newData: PermitLimitData = {
      municipality: municipality,
      system_id: provider_system_id,
      modality: vehicle_type,
      effective_date: selectedDate,
      minimum_vehicles: minimumVehiculesActive ? (minimumVehicules !== '' ? minimumVehicules : currentRecord?.minimum_vehicles) : PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles,
      maximum_vehicles: maximumVehiculesActive ? (maximumVehicules !== '' ? maximumVehicules : currentRecord?.maximum_vehicles) : PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles,
      max_parking_duration: maxParkingDurationActive ? (maxParkingDuration !== '' ? daysToIsoDuration(maxParkingDuration) : currentRecord?.max_parking_duration) : PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration,
      minimal_number_of_trips_per_vehicle: minimalNumberOfTripsPerVehicleActive ? (minimalNumberOfTripsPerVehicle !== '' ? minimalNumberOfTripsPerVehicle : currentRecord?.minimal_number_of_trips_per_vehicle) : PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle, 
    };

    if(currentRecord?.effective_date === selectedDate) {
      newData.permit_limit_id = currentRecord.permit_limit_id; 
    }

    return newData;
  }

  const handleOk = () => {
    onOk(getNewData());
  };

  const itemIsValid = (field: string, value: string|number, isActive: boolean) => {
    const result = (
      !isActive ||
      (currentRecord===null && value !== '') ||  // value must be set when there is no earlier record
      (currentRecord!==null && value !== currentRecord[field]) ||  // value must be set and changed
      (isNumber(value) && Number(value) > 0)     // value must be a number > 0
    )
    return result;
  }

  let minCapacityMessage = '';
  let maxCapacityMessage = '';
  let maxParkingDurationMessage = '';
  let minNumberOfTripsPerVehicleMessage = '';
  if(currentRecord!==null) {
    minCapacityMessage = '(' + (currentRecord.minimum_vehicles === PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles ? 'niet actief' : currentRecord.minimum_vehicles.toString()) + ')';
    maxCapacityMessage = '(' + (currentRecord.maximum_vehicles === PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles ? 'niet actief' : currentRecord.maximum_vehicles.toString()) + ')';
    maxParkingDurationMessage = '(' + (isoDurationToDays(currentRecord.max_parking_duration) === isoDurationToDays(PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration) ? 'niet actief' : isoDurationToDays(currentRecord.max_parking_duration).toString()) + ')';
    minNumberOfTripsPerVehicleMessage = '(' + (currentRecord.minimal_number_of_trips_per_vehicle === PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle ? 'niet actief' : currentRecord.minimal_number_of_trips_per_vehicle.toString()) + ')';
  }

  let isValid = 
    itemIsValid('minimumVehicules', minimumVehicules, minimumVehiculesActive) &&
    itemIsValid('maximumVehicules', maximumVehicules, maximumVehiculesActive) &&
    itemIsValid('maxParkingDuration', maxParkingDuration, maxParkingDurationActive) &&
    itemIsValid('minimalNumberOfTripsPerVehicle', minimalNumberOfTripsPerVehicle, minimalNumberOfTripsPerVehicleActive);

  let newData = getNewData();
  let isChanged = 
    newData.minimum_vehicles !== currentRecord?.minimum_vehicles ||
    newData.maximum_vehicles !== currentRecord?.maximum_vehicles ||
    isoDurationToDays(newData.max_parking_duration) !== isoDurationToDays(currentRecord?.max_parking_duration) ||
    newData.minimal_number_of_trips_per_vehicle !== currentRecord?.minimal_number_of_trips_per_vehicle;

  const provider = getProvider(provider_system_id);

  const providerName = provider?.name || provider_system_id;
  const providerLogo = provider ? provider.logo : createSvgPlaceholder({
    width: 48,
    height: 48,
    text: providerName.slice(0, 2),
    bgColor: '#0F1C3F',
    textColor: '#7FDBFF',
  });
  const vehicleTypeLogo = getVehicleIconUrl(vehicle_type);
  const vehicleTypeName = getPrettyVehicleTypeName(vehicle_type) || vehicle_type;

  const isNormalMode = mode === 'normal';

  return (
    <div className="flex flex-col gap-4">
      {/* Provider and vehicle type side by side */}
      <div className="flex flex-row justify-center items-start gap-12 mb-2">
        {/* Provider column */}
        <div className="flex flex-col items-center">
          <div className="min-h-[64px] flex items-center justify-center">
              <img src={providerLogo} alt={providerName} className="w-16 h-16 object-contain mb-1" 
                onError={(e) => {
                    e.currentTarget.src = createSvgPlaceholder({
                    width: 48,
                    height: 48,
                    text: providerName.slice(0, 2),
                    bgColor: '#0F1C3F',
                    textColor: '#7FDBFF',
                    fontSize: 24,
                    fontWeight: 'bold',
                    fontFamily: 'Arial, sans-serif',
                    dy: 7,
                    radius: 4,
                    });
                  }}
               />
          </div>
          <div className="text-center text-base font-medium text-gray-800 mt-1">{providerName}</div>
        </div>
        {/* Vehicle type column */}
        <div className="flex flex-col items-center">
          <div className="min-h-[64px] flex items-center justify-center">
            {vehicleTypeLogo && (
              <img src={vehicleTypeLogo} alt={vehicleTypeName} className="w-16 h-16 object-contain mb-1" />
            )}
          </div>
          <div className="text-center text-base font-medium text-gray-800 mt-1">{vehicleTypeName}</div>
        </div>
      </div>
      <div className="flex flex-col items-center">
      { currentRecord ? 
          <span>Voertuigplafond actief vanaf {currentRecord.effective_date} {currentRecord.end_date ? `tot en met ${currentRecord.end_date}` : ''}</span>
          : 
          'Geen voertuigplafond actief' }
      </div>
      <hr className="w-full border-t-2 border-gray-300" />
      <div className="flex flex-col items-center">
        <span>Voertuigplafond aanpassen</span>
      </div>
      {/* Date controls row, aligned as a form row */}
      <div className="flex flex-row items-end gap-3 mb-2">
        <label className="w-56 text-sm text-gray-700">Ingangsdatum</label>
        <div className="flex flex-row items-end gap-4">
          {/* Start date */}
          {/* <div className="flex flex-col items-start w-40">
            <label htmlFor="start-date" className="text-xs text-gray-600 mb-1">Startdatum</label> */}
            <input
              id="start-date"
              type="date"
              className="border rounded px-2 py-1 w-full"
              value={selectedDate}
              {...(isNormalMode ? { min: tomorrow } : {})}
              onChange={handleSelectedDateChange}
            />
        </div>
      </div>
      {/* Other fields: label, input, and actief checkbox on a single line, left aligned */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="min-capacity" className="w-56 text-sm text-gray-700">Minimum capaciteit</label>
          <input
            id="min-capacity"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={minimumVehiculesActive ? minimumVehicules : ''}
            min={0}
            onChange={e => setMinimumVehicules(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!minimumVehiculesActive}
            readOnly={!minimumVehiculesActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={minimumVehiculesActive} onChange={e => setMinimumVehiculesActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">{minCapacityMessage}</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="max-capacity" className="w-56 text-sm text-gray-700">Maximum capaciteit</label>
          <input
            id="max-capacity"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={maximumVehiculesActive ? maximumVehicules : ''}
            min={0}
            onChange={e => setMaximumVehicules(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!maximumVehiculesActive}
            readOnly={!maximumVehiculesActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={maximumVehiculesActive} onChange={e => setMaximumVehiculesActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">{maxCapacityMessage}</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="min-pct-duration" className="w-56 text-sm text-gray-700">Maximale parkeerduur (dagen)</label>
          <input
            id="min-pct-duration"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={maxParkingDurationActive ? maxParkingDuration : ''}
            min={0}
            max={100}
            onChange={e => setMaxParkingDuration(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!maxParkingDurationActive}
            readOnly={!maxParkingDurationActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={maxParkingDurationActive} onChange={e => setMaxParkingDurationActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">{maxParkingDurationMessage}</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="min-pct-rides" className="w-56 text-sm text-gray-700">Min. percentage ritten per voertuig correct</label>
          <input
            id="min-pct-rides"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={minimalNumberOfTripsPerVehicleActive ? minimalNumberOfTripsPerVehicle : ''}
            min={0}
            max={100}
            onChange={e => setMinimalNumberOfTripsPerVehicle(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!minimalNumberOfTripsPerVehicleActive}
            readOnly={!minimalNumberOfTripsPerVehicleActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={minimalNumberOfTripsPerVehicleActive} onChange={e => setMinimalNumberOfTripsPerVehicleActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">{minNumberOfTripsPerVehicleMessage}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onCancel}>Cancel</button>
        <button className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${isValid && isChanged ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`} onClick={handleOk} disabled={!isValid}>OK</button>
      </div>
    </div>
  );
};

export default EditLimitsDialog; 