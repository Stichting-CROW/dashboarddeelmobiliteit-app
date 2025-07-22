import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { getProvider } from '../../helpers/providers.js';
import { getVehicleIconUrl, getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { settingsrow } from './Permits';

interface EditLimitsDialogProps {
  municipality: string;
  provider_system_id: string;
  vehicle_type: string;
  mode: 'normal' | 'admin';
  onOk: (formData: any) => void;
  onCancel: () => void;
  settingsTable: settingsrow[];
}

// Helper: get 'niet actief' value for each field
const NIET_ACTIEF = {
  min_capacity: 0,
  max_capacity: 99999999,
  min_pct_duration_correct: 0,
  min_pct_rides_per_vehicle_correct: 0,
  max_vehicles_illegally_parked_count: 0,
};

const EditLimitsDialog: React.FC<EditLimitsDialogProps> = ({ municipality, provider_system_id, vehicle_type, mode, onOk, onCancel, settingsTable }) => {
  // Initial date logic
  const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
  const [startDate, setStartDate] = useState(tomorrow);
  // Replace 'indefinite' with 'showEndDate' for clarity
  const [showEndDate, setShowEndDate] = useState(true);
  const [endDate, setEndDate] = useState('');

  // Add state for all fields
  const [minCapacity, setMinCapacity] = useState<number | ''>('');
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('');
  const [minPctDurationCorrect, setMinPctDurationCorrect] = useState<number | ''>('');
  const [minPctRidesPerVehicleCorrect, setMinPctRidesPerVehicleCorrect] = useState<number | ''>('');
  const [maxIllegallyParked, setMaxIllegallyParked] = useState<number | ''>('');

  // Add state for 'actief' checkboxes for each field
  const [minCapacityActive, setMinCapacityActive] = useState(true);
  const [maxCapacityActive, setMaxCapacityActive] = useState(true);
  const [minPctDurationActive, setMinPctDurationActive] = useState(true);
  const [minPctRidesActive, setMinPctRidesActive] = useState(true);
  const [maxIllegallyParkedActive, setMaxIllegallyParkedActive] = useState(true);

  // Simulate backend fetch: find the correct record for the keys and startDate
  const findCurrentRecord = useCallback(() => {
    return settingsTable.find(row =>
      row.municipality === municipality &&
      row.operator_system_id === provider_system_id &&
      row.voertuigtype === vehicle_type &&
      moment(startDate).isSameOrAfter(row.valid_from_iso8601) &&
      moment(startDate).isBefore(row.valid_until_iso8601)
    );
  }, [municipality, provider_system_id, vehicle_type, startDate, settingsTable]);

  const [currentRecord, setCurrentRecord] = useState<any | null>(null);

  // Fetch current record on mount and when startDate changes
  useEffect(() => {
    setCurrentRecord(findCurrentRecord());
  }, [settingsTable, municipality, provider_system_id, vehicle_type, startDate, findCurrentRecord]);

  // Set initial actief state based on huidig value
  useEffect(() => {
    if (!currentRecord) return;
    setMinCapacityActive(currentRecord.min_capacity !== NIET_ACTIEF.min_capacity);
    setMaxCapacityActive(currentRecord.max_capacity !== NIET_ACTIEF.max_capacity);
    setMinPctDurationActive(currentRecord.min_pct_duration_correct !== NIET_ACTIEF.min_pct_duration_correct);
    setMinPctRidesActive(currentRecord.min_rides_per_vehicle_pct_correct !== NIET_ACTIEF.min_pct_rides_per_vehicle_correct);
    setMaxIllegallyParkedActive(currentRecord.max_vehicles_illegally_parked_count !== NIET_ACTIEF.max_vehicles_illegally_parked_count);
  }, [currentRecord, provider_system_id, vehicle_type, municipality, startDate, settingsTable]);

  // Set showEndDate and endDate based on currentRecord's valid_until_iso8601
  useEffect(() => {
    if (!currentRecord) return;
    setShowEndDate(currentRecord.valid_until_iso8601 !== '9999-12-31');
    setEndDate(currentRecord.valid_until_iso8601 !== '9999-12-31' ? currentRecord.valid_until_iso8601 : '');
  }, [currentRecord]);

  // Provider and vehicle type info
  const provider = getProvider(provider_system_id);
  console.log(provider);

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

  // Date field enable/disable logic
  const isNormalMode = mode === 'normal';
  const isAdminMode = mode === 'admin';

  // In normal mode, always indefinite, end date and checkbox disabled
  // In admin mode, checkbox and end date enabled
  // (already handled by disables below)

  // Handlers
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  // Handler for checkbox
  const handleShowEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowEndDate(e.target.checked);
    if (!e.target.checked) setEndDate('');
  };

  // Validation
  const isNumber = (v: any) => typeof v === 'number' && !isNaN(v);
  const isValid =
    (!minCapacityActive || minCapacity === '' || isNumber(minCapacity)) &&
    (!maxCapacityActive || maxCapacity === '' || isNumber(maxCapacity)) &&
    (!minPctDurationActive || minPctDurationCorrect === '' || (isNumber(minPctDurationCorrect) && minPctDurationCorrect >= 0 && minPctDurationCorrect <= 100)) &&
    (!minPctRidesActive || minPctRidesPerVehicleCorrect === '' || (isNumber(minPctRidesPerVehicleCorrect) && minPctRidesPerVehicleCorrect >= 0 && minPctRidesPerVehicleCorrect <= 100)) &&
    (!maxIllegallyParkedActive || maxIllegallyParked === '' || isNumber(maxIllegallyParked)) &&
    (showEndDate || !endDate || moment(endDate).isAfter(startDate));

  // Ok handler (now passes all fields)
  const handleOk = () => {
    // Compute current values with actief logic, using original value if edit box is empty
    const current = {
      min_capacity: minCapacityActive ? (minCapacity !== '' ? minCapacity : currentRecord?.min_capacity) : 0,
      max_capacity: maxCapacityActive ? (maxCapacity !== '' ? maxCapacity : currentRecord?.max_capacity) : 99999999,
      min_pct_duration_correct: minPctDurationActive ? (minPctDurationCorrect !== '' ? minPctDurationCorrect : currentRecord?.min_pct_duration_correct) : 0,
      min_pct_rides_per_vehicle_correct: minPctRidesActive ? (minPctRidesPerVehicleCorrect !== '' ? minPctRidesPerVehicleCorrect : currentRecord?.min_rides_per_vehicle_pct_correct) : 0,
      max_vehicles_illegally_parked_count: maxIllegallyParkedActive ? (maxIllegallyParked !== '' ? maxIllegallyParked : currentRecord?.max_vehicles_illegally_parked_count) : 0,
      valid_from_iso8601: startDate,
      valid_until_iso8601: showEndDate ? endDate : '9999-12-31',
    };
    // Compute original values with actief logic
    const original = {
      min_capacity: currentRecord?.min_capacity > 0 ? currentRecord.min_capacity : 0,
      max_capacity: currentRecord?.max_capacity < 99999999 ? currentRecord.max_capacity : 99999999,
      min_pct_duration_correct: currentRecord?.min_pct_duration_correct > 0 ? currentRecord.min_pct_duration_correct : 0,
      min_pct_rides_per_vehicle_correct: currentRecord?.min_rides_per_vehicle_pct_correct > 0 ? currentRecord.min_rides_per_vehicle_pct_correct : 0,
      max_vehicles_illegally_parked_count: currentRecord?.max_vehicles_illegally_parked_count > 0 ? currentRecord.max_vehicles_illegally_parked_count : 0,
      valid_from_iso8601: currentRecord?.valid_from_iso8601,
      valid_until_iso8601: currentRecord?.valid_until_iso8601,
    };
    // Build changed fields: only include if value is different and (for limits) the edit box is non-empty
    const changedFields = {};
    Object.keys(current).forEach(key => {
      if (
        (key === 'min_capacity' && minCapacityActive && minCapacity !== '' && String(current[key]) !== String(original[key])) ||
        (key === 'max_capacity' && maxCapacityActive && maxCapacity !== '' && String(current[key]) !== String(original[key])) ||
        (key === 'min_pct_duration_correct' && minPctDurationActive && minPctDurationCorrect !== '' && String(current[key]) !== String(original[key])) ||
        (key === 'min_pct_rides_per_vehicle_correct' && minPctRidesActive && minPctRidesPerVehicleCorrect !== '' && String(current[key]) !== String(original[key])) ||
        (key === 'max_vehicles_illegally_parked_count' && maxIllegallyParkedActive && maxIllegallyParked !== '' && String(current[key]) !== String(original[key])) ||
        (key === 'valid_from_iso8601' && String(current[key]) !== String(original[key])) ||
        (key === 'valid_until_iso8601' && String(current[key]) !== String(original[key]))
      ) {
        changedFields[key] = current[key];
      }
    });
    // If no changes, return false
    if (Object.keys(changedFields).length === 0) {
      alert('false');
      return;
    }
    // Determine type: 'new' if start date changed, else 'update'
    const type = String(current.valid_from_iso8601) !== String(original.valid_from_iso8601) ? 'new' : 'update';
    // For 'new', always include all fields; for 'update', only changed fields
    const allFields = {
      min_capacity: current.min_capacity,
      max_capacity: current.max_capacity,
      min_pct_duration_correct: current.min_pct_duration_correct,
      min_pct_rides_per_vehicle_correct: current.min_pct_rides_per_vehicle_correct,
      max_vehicles_illegally_parked_count: current.max_vehicles_illegally_parked_count,
      valid_from_iso8601: current.valid_from_iso8601,
      valid_until_iso8601: current.valid_until_iso8601,
    };
    const apiData = {
      municipality: municipality,
      provider_system_id: provider_system_id,
      vehicle_type: vehicle_type,
      type,
      ...(type === 'new' ? allFields : changedFields)
    };
    alert(JSON.stringify(apiData, null, 2));
    onOk(apiData);
  };

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
      {/* Date controls row, aligned as a form row */}
      <div className="flex flex-row items-end gap-3 mb-2">
        <label className="w-56 text-sm text-gray-700">Periode</label>
        <div className="flex flex-row items-end gap-4">
          {/* Start date */}
          <div className="flex flex-col items-start w-40">
            <label htmlFor="start-date" className="text-xs text-gray-600 mb-1">Startdatum</label>
            <input
              id="start-date"
              type="date"
              className="border rounded px-2 py-1 w-full"
              value={startDate}
              {...(isNormalMode ? { min: tomorrow } : {})}
              onChange={handleStartDateChange}
            />
          </div>
          {/* End date with checkbox in label, only in admin mode */}
          {isAdminMode && (
            <div className="flex flex-col items-start w-56">
              <label className="text-xs text-gray-600 mb-1 flex items-center gap-2" htmlFor="end-date">
                <input
                  type="checkbox"
                  checked={showEndDate}
                  onChange={handleShowEndDateChange}
                  disabled={isNormalMode}
                  className="align-middle"
                  id="show-enddate-checkbox"
                />
                Einddatum
              </label>
              <input
                id="end-date"
                type={showEndDate ? 'date' : 'text'}
                className="border rounded px-2 py-1 w-full"
                value={showEndDate ? endDate : ''}
                min={showEndDate ? startDate : undefined}
                onChange={handleEndDateChange}
                disabled={isNormalMode || !showEndDate}
                readOnly={!showEndDate}
                placeholder={showEndDate ? '' : ''}
                style={!showEndDate ? { backgroundColor: '#fff' } : {}}
              />
            </div>
          )}
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
            value={minCapacityActive ? minCapacity : ''}
            min={0}
            onChange={e => setMinCapacity(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!minCapacityActive}
            readOnly={!minCapacityActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={minCapacityActive} onChange={e => setMinCapacityActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">({currentRecord?.min_capacity === NIET_ACTIEF.min_capacity ? 'niet actief' : currentRecord?.min_capacity})</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="max-capacity" className="w-56 text-sm text-gray-700">Maximum capaciteit</label>
          <input
            id="max-capacity"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={maxCapacityActive ? maxCapacity : ''}
            min={0}
            onChange={e => setMaxCapacity(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!maxCapacityActive}
            readOnly={!maxCapacityActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={maxCapacityActive} onChange={e => setMaxCapacityActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">({currentRecord?.max_capacity === NIET_ACTIEF.max_capacity ? 'niet actief' : currentRecord?.max_capacity})</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="min-pct-duration" className="w-56 text-sm text-gray-700">Min. percentage stilstand correct</label>
          <input
            id="min-pct-duration"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={minPctDurationActive ? minPctDurationCorrect : ''}
            min={0}
            max={100}
            onChange={e => setMinPctDurationCorrect(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!minPctDurationActive}
            readOnly={!minPctDurationActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={minPctDurationActive} onChange={e => setMinPctDurationActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">({currentRecord?.min_pct_duration_correct === NIET_ACTIEF.min_pct_duration_correct ? 'niet actief' : currentRecord?.min_pct_duration_correct})</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="min-pct-rides" className="w-56 text-sm text-gray-700">Min. percentage ritten per voertuig correct</label>
          <input
            id="min-pct-rides"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={minPctRidesActive ? minPctRidesPerVehicleCorrect : ''}
            min={0}
            max={100}
            onChange={e => setMinPctRidesPerVehicleCorrect(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!minPctRidesActive}
            readOnly={!minPctRidesActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={minPctRidesActive} onChange={e => setMinPctRidesActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">({currentRecord?.min_rides_per_vehicle_pct_correct === NIET_ACTIEF.min_pct_rides_per_vehicle_correct ? 'niet actief' : currentRecord?.min_rides_per_vehicle_pct_correct})</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <label htmlFor="max-illegally-parked" className="w-56 text-sm text-gray-700">Max. fout geparkeerde voertuigen</label>
          <input
            id="max-illegally-parked"
            type="number"
            className="border rounded px-2 py-1 w-32"
            value={maxIllegallyParkedActive ? maxIllegallyParked : ''}
            min={0}
            onChange={e => setMaxIllegallyParked(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!maxIllegallyParkedActive}
            readOnly={!maxIllegallyParkedActive}
          />
          <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
            <input type="checkbox" checked={maxIllegallyParkedActive} onChange={e => setMaxIllegallyParkedActive(e.target.checked)} />
            actief
          </label>
          <span className="ml-2 text-xs text-gray-400">({currentRecord?.max_vehicles_illegally_parked_count === NIET_ACTIEF.max_vehicles_illegally_parked_count ? 'niet actief' : currentRecord?.max_vehicles_illegally_parked_count})</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onCancel}>Cancel</button>
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleOk} disabled={!isValid}>OK</button>
      </div>
    </div>
  );
};

export default EditLimitsDialog; 