import React, { useEffect, useState, useRef } from 'react';
import moment from 'moment';
import { getVehicleIconUrl, getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import { getPermitLimitHistory, PERMIT_LIMITS_NIET_ACTIEF, PermitLimitData, deletePermitLimit } from '../../api/permitLimits';
import { getProvider } from '../../helpers/providers'; // TODO: use operators from parent component (has no logo info now)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
interface EditLimitsDialogProps {
  token: string;
  municipality: string;
  provider_system_id: string;
  vehicle_type: string;
  mode: 'normal' | 'admin';
  onOk: (formData: PermitLimitData) => void;
  onCancel: () => void;
  onHistoryChanged?: () => void;
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

// Add a custom X axis tick renderer for subtle date labels
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize="0.8em">
        {payload.value}
      </text>
    </g>
  );
};

const EditLimitsDialog: React.FC<EditLimitsDialogProps> = ({ token, municipality, provider_system_id, vehicle_type, mode, onOk, onCancel, onHistoryChanged }) => {
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

  // Add state for tab selection
  const [activeTab, setActiveTab] = useState<'aanpassen' | 'historisch'>('aanpassen');

  // State for highlighting table row on chart hover
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  // State for hovered table row (for chart indicator)
  const [hoveredTableDate, setHoveredTableDate] = useState<string | null>(null);
  // Refs for each row by date
  const rowRefs = useRef<{ [date: string]: HTMLTableRowElement | null }>({});

  // Scroll highlighted row into view when highlightedDate changes
  useEffect(() => {
    if (highlightedDate && rowRefs.current[highlightedDate]) {
      rowRefs.current[highlightedDate]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedDate]);

  // Helper to reload history
  const reloadHistory = async () => {
    const history = await getPermitLimitHistory(token, municipality, provider_system_id, vehicle_type);
    setPermitHistory(history ? history.sort((a, b) => moment(a.effective_date).diff(moment(b.effective_date))) : null);
    if (typeof onHistoryChanged === 'function') onHistoryChanged();
  };

  // Fetch current record on mount and when startDate changes
  useEffect(() => {
    reloadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    moment.locale(navigator.language);
  }, []);

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

  // Render function for the Aanpassen tab content
  const renderAanpassenTab = () => (
    <>
      {/* Restore van / tot en met row */}
      <div className="flex flex-col items-center">
        {currentRecord ? (
          <span>Voertuigplafond actief vanaf {moment(currentRecord.effective_date).format('L')} {currentRecord.end_date ? `tot en met ${moment(currentRecord.end_date).format('L')}` : ''}</span>
        ) : (
          <span>Geen voertuigplafond actief</span>
        )}
      </div>
      {/* Date controls row, aligned as a form row */}
      <div className="flex flex-row items-end gap-3 mb-2">
        <label className="w-56 text-sm text-gray-700">Ingangsdatum</label>
        <div className="flex flex-row items-end gap-4">
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
        <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onCancel}>Afbreken</button>
        <button className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${isValid && isChanged ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`} onClick={handleOk} disabled={!isValid}>Opslaan</button>
      </div>
    </>
  );

  // Render function for the Historisch tab content
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const handleEditRecord = (date: string) => {
    setSelectedDate(date);
    setActiveTab('aanpassen');
  };
  const handleDeleteRecord = async (permit_limit_id: number) => {
    if (!window.confirm('Weet je zeker dat je deze limiet wilt verwijderen?')) return;
    setDeletingId(permit_limit_id);
    await deletePermitLimit(token, permit_limit_id);
    await reloadHistory();
    setDeletingId(null);
  };
  const renderHistorischTab = () => {
    // Sort descending by effective_date
    const sortedHistory = permitHistory ? [...permitHistory].sort((a, b) => moment(b.effective_date).diff(moment(a.effective_date))) : [];
    // Prepare chart data (ascending for line chart)
    const chartData = [...sortedHistory].reverse().map(rec => ({
      date: moment(rec.effective_date).format('YYYY-MM-DD'),
      minimum_vehicles: rec.minimum_vehicles === PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles ? null : rec.minimum_vehicles,
      maximum_vehicles: rec.maximum_vehicles === PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles ? null : rec.maximum_vehicles,
      max_parking_duration_days: (rec.max_parking_duration === PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration || rec.max_parking_duration === 'T0S') ? null : isoDurationToDays(rec.max_parking_duration),
      minimal_number_of_trips_per_vehicle: rec.minimal_number_of_trips_per_vehicle === PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle ? null : rec.minimal_number_of_trips_per_vehicle,
    }));
    return (
      <>
        <div className="overflow-x-auto w-full" style={sortedHistory.length > 10 ? { maxHeight: 320, overflowY: 'auto' } : {}}>
          <table className="min-w-full text-xs border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">Ingangsdatum</th>
                <th className="px-2 py-1 border">Minimum</th>
                <th className="px-2 py-1 border">Maximum</th>
                <th className="px-2 py-1 border">Max. parkeerduur</th>
                <th className="px-2 py-1 border">Min. % ritten</th>
                <th className="px-2 py-1 border">Acties</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.length > 0 ? sortedHistory.map((rec) => (
                <tr
                  key={rec.permit_limit_id || rec.effective_date}
                  ref={el => { rowRefs.current[moment(rec.effective_date).format('YYYY-MM-DD')] = el; }}
                  className={`border-b hover:bg-gray-50${highlightedDate === moment(rec.effective_date).format('YYYY-MM-DD') ? ' bg-blue-100' : ''}`}
                  onMouseEnter={() => setHoveredTableDate(moment(rec.effective_date).format('YYYY-MM-DD'))}
                  onMouseLeave={() => setHoveredTableDate(null)}
                >
                  <td className="px-2 py-1 border whitespace-nowrap">{moment(rec.effective_date).format('L')}</td>
                  <td className="px-2 py-1 border text-center">{rec.minimum_vehicles === PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles ? 'niet actief' : rec.minimum_vehicles}</td>
                  <td className="px-2 py-1 border text-center">{rec.maximum_vehicles === PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles ? 'niet actief' : rec.maximum_vehicles}</td>
                  <td className="px-2 py-1 border text-center">{(rec.max_parking_duration === PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration || rec.max_parking_duration === 'T0S') ? 'niet actief' : rec.max_parking_duration.replace('P','').replace('D',' dagen')}</td>
                  <td className="px-2 py-1 border text-center">{rec.minimal_number_of_trips_per_vehicle === PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle ? 'niet actief' : rec.minimal_number_of_trips_per_vehicle}</td>
                  <td className="px-2 py-1 border text-center">
                    <button title="Aanpassen" className="inline-block align-middle mr-1 p-1 hover:bg-gray-200 rounded" onClick={() => handleEditRecord(rec.effective_date)}>
                      {/* Pencil SVG */}
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg"><path d="M14.85 2.85a2.121 2.121 0 0 1 3 3l-9.193 9.193a2 2 0 0 1-.708.464l-3.5 1.25a.5.5 0 0 1-.637-.637l1.25-3.5a2 2 0 0 1 .464-.708L14.85 2.85zm2.12.88a1.121 1.121 0 0 0-1.586 0l-1.293 1.293 1.586 1.586 1.293-1.293a1.121 1.121 0 0 0 0-1.586zm-2.293 2.293l-8.5 8.5-.75 2.1 2.1-.75 8.5-8.5-1.85-1.85z" fill="#666"/></svg>
                    </button>
                    <button title="Verwijderen" className="inline-block align-middle p-1 hover:bg-gray-200 rounded" onClick={() => rec.permit_limit_id && handleDeleteRecord(rec.permit_limit_id)} disabled={deletingId === rec.permit_limit_id}>
                      {/* Trash SVG */}
                      {deletingId === rec.permit_limit_id ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline animate-spin" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2" fill="none"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg"><path d="M7 8v6m3-6v6m3-8V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1M4 6h12m-1 0v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h10z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center text-gray-400 py-4">Geen historische limieten gevonden</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Line chart below the table */}
        <div className="w-full flex flex-row mt-8" style={{ minHeight: 320 }}>
          <ResponsiveContainer width="75%" height={320}>
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
              onMouseMove={state => {
                if (state && state.activeLabel) setHighlightedDate(state.activeLabel);
              }}
              onMouseLeave={() => setHighlightedDate(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={<CustomXAxisTick />} />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Capaciteit', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Dagen / %', angle: 90, position: 'insideRight', fontSize: 12 }} />
              <Tooltip content={() => null} />
              {hoveredTableDate && (
                <ReferenceLine x={hoveredTableDate} yAxisId="left" stroke="#888" strokeDasharray="4 2" />
              )}
              <Line yAxisId="left" type="linear" dataKey="minimum_vehicles" name="Minimum capaciteit" stroke="#1f77b4" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line yAxisId="left" type="linear" dataKey="maximum_vehicles" name="Maximum capaciteit" stroke="#ff7f0e" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line yAxisId="right" type="linear" dataKey="max_parking_duration_days" name="Max. parkeerduur (dagen)" stroke="#2ca02c" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line yAxisId="right" type="linear" dataKey="minimal_number_of_trips_per_vehicle" name="Min. % ritten" stroke="#d62728" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center ml-4">
            <div className="mb-2 font-semibold">Legenda</div>
            <div className="flex flex-col gap-2 text-xs">
              <span className="flex items-center"><span className="inline-block w-4 h-1 rounded bg-[#1f77b4] mr-2"></span>Minimum capaciteit</span>
              <span className="flex items-center"><span className="inline-block w-4 h-1 rounded bg-[#ff7f0e] mr-2"></span>Maximum capaciteit</span>
              <span className="flex items-center"><span className="inline-block w-4 h-1 rounded bg-[#2ca02c] mr-2"></span>Max. parkeerduur (dagen)</span>
              <span className="flex items-center"><span className="inline-block w-4 h-1 rounded bg-[#d62728] mr-2"></span>Min. % ritten</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4 min-h-[600px] relative">
      {/* Close icon in top right */}
      <button
        onClick={onCancel}
        title="Sluiten"
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
        style={{ zIndex: 10 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" stroke="#888" strokeWidth="1.5" fill="#fff"/>
          <path d="M8 8l8 8M16 8l-8 8" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
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
      {/* Tab header */}
      <div className="flex flex-row justify-center gap-4 border-b border-gray-300 mb-2">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'aanpassen' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('aanpassen')}
        >
          Aanpassen
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'historisch' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('historisch')}
        >
          Historisch
        </button>
      </div>
      {/* Tab content */}
      {activeTab === 'aanpassen' ? (
        renderAanpassenTab()
      ) : (
        renderHistorischTab()
      )}
    </div>
  );
};

export default EditLimitsDialog; 