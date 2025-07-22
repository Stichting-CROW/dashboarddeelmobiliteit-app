import { useEffect, useState } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import PermitsCard from './PermitsCard';
import EditLimitsDialog from './EditLimitsDialog';

import { StateType } from '../../types/StateType';

// import { getAvailableOperators } from '../../api/service-areas';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';
import { generateMockSettingstable, generateMockOccupancyCurrent, updateMockSettingsTable } from './PermitsMockData';

// first generate a virtual table with the settings
export interface settingsrow {
  municipality: string;
  voertuigtype: string;
  operator_system_id: string;
  valid_from_iso8601: string;
  valid_until_iso8601: string;
  min_capacity: number;
  max_capacity: number;
  min_pct_duration_correct: number;
  min_rides_per_vehicle_pct_correct: number;
  max_vehicles_illegally_parked_count: number;  
}
export interface APIPermitResultCurrent {
  id: number;

  // bin
  municipality: string;
  voertuigtype: string;
  operator_system_id: string;

  // settings
  valid_from_iso8601: string;
  valid_until_iso8601: string;  
  min_capacity: number;
  max_capacity: number;
  min_pct_duration_correct: number;
  min_rides_per_vehicle_pct_correct: number;
  max_vehicles_illegally_parked_count: number;

  // kpis
  current_capacity: number;
  pct_duration_correct : number;
  pct_rides_per_vehicle_correct : number;
  vehicles_illegally_parked_count: number;
}

const Permits = () => {
  const aanbieders = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });

  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);
  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types);  

  const [permits, setPermits] = useState<APIPermitResultCurrent[]>([]);

  const [mockSettingstable, setMockSettingstable] = useState<settingsrow[]>([]);
  const [availableOperatorSystemIds, setAvailableOperatorSystemIds] = useState<string[]>([]);

  // useEffect(() => {
  //   getAvailableOperators(activeorganisation).then((availableOperatorSystemIds) => {
  //     console.log('*** availableOperatorSystemIds', availableOperatorSystemIds)
  //     setAvailableOperatorSystemIds(availableOperatorSystemIds.operators_with_service_area);
  //   });
  // }, [activeorganisation]);

  useEffect(() => {
    const fetchMockSettingstable = async () => {
      const mockSettingstable = await generateMockSettingstable(activeorganisation, voertuigtypes.map((voertuigtype) => voertuigtype.id), aanbieders);
      setMockSettingstable(mockSettingstable);
    }

    fetchMockSettingstable();
  }, [activeorganisation, voertuigtypes, aanbieders]);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch permits
    const fetchPermits = async () => {
      // This is a placeholder - replace with actual API call
      const mockPermits: APIPermitResultCurrent[] = generateMockOccupancyCurrent(
        mockSettingstable,
        availableOperatorSystemIds,
        moment().format('YYYY-MM-DD')
      );

      setPermits(mockPermits);
    };

    fetchPermits();
  }, [mockSettingstable, availableOperatorSystemIds]);

  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogPermit, setEditDialogPermit] = useState<APIPermitResultCurrent | null>(null);

  // Admin/normal mode toggle
  const [mode, setMode] = useState<'normal' | 'admin'>('normal');

  // Handler to open edit dialog
  const handleEditLimits = (permit: APIPermitResultCurrent) => {
    setEditDialogPermit(permit);
    setEditDialogOpen(true);
  };

  // Handler to close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditDialogPermit(null);
  };

  // Handler for OK (now updates mock data and reloads)
  const handleEditDialogOk = (formData: any) => {
    if (!editDialogPermit) return;
    // Compose new row for settings table
    const newRow = {
      municipality: editDialogPermit.municipality,
      voertuigtype: editDialogPermit.voertuigtype,
      operator_system_id: editDialogPermit.operator_system_id,
      valid_from_iso8601: formData.startDate,
      valid_until_iso8601: formData.indefinite ? '9999-12-31' : (formData.endDate || '9999-12-31'),
      min_capacity: formData.minCapacity,
      max_capacity: formData.maxCapacity,
      min_pct_duration_correct: formData.minPctDurationCorrect,
      min_rides_per_vehicle_pct_correct: formData.minPctRidesPerVehicleCorrect,
      max_vehicles_illegally_parked_count: formData.maxIllegallyParked,
    };
    // Update mock settings table
    const updatedSettings = updateMockSettingsTable(mockSettingstable, newRow, mode);
    setMockSettingstable(updatedSettings);
    setEditDialogOpen(false);
    setEditDialogPermit(null);
  };

  if(activeorganisation === "") {
    return (
      <div>
        <h1 className="text-4xl font-bold mb-8">
          Voertuigplafonds
        </h1>
        <span className="text-gray-600">
          Selecteer een plaats om voertuigplafonds te bekijken
        </span>
      </div>
    )
  }

  const renderPermitCardsForVoertuigtype = (voertuigtype: {id: string, name: string}) => {
    const permitsForVoertuigtype = permits.filter((permit) => permit.voertuigtype === voertuigtype.id);

    let voertuigLogo = getVehicleIconUrl(voertuigtype.id);
    if(!voertuigLogo) {
      voertuigLogo = getVehicleIconUrl('other');
    }

    return (
      <div key={'voertuigtype-' + voertuigtype.id} className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <img
            src={voertuigLogo}
            alt={voertuigtype.name}
            className="inline-block w-8 h-8 object-contain"
            style={{ verticalAlign: 'middle' }}
          />
          {getPrettyVehicleTypeName(voertuigtype.id) || `Onbekend`}
        </h2>
        {/* Cards: flex row, wrap, gap */}
        <div className="flex flex-wrap gap-6">
          {permitsForVoertuigtype.map((permit) => (
            <PermitsCard key={'permits-card-' + permit.id} permit={permit} onEditLimits={() => handleEditLimits(permit)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-4xl font-bold mb-8 flex items-center gap-4">
        Voertuigplafonds
        <button
          className={`ml-4 px-3 py-1 rounded ${mode === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setMode(mode === 'normal' ? 'admin' : 'normal')}
        >
          {mode === 'admin' ? 'Admin modus' : 'Normale modus'}
        </button>
      </div>
      
      <div>
        {/* Outer: stack voertuigtypes vertically */}
        {voertuigtypes.map((voertuigtype) => {
          return renderPermitCardsForVoertuigtype(voertuigtype);
        })}
      </div>
      {/* Edit Limits Modal Dialog */}
      {editDialogOpen && editDialogPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-2xl">
            <div className="text-lg font-semibold mb-4">Voertuigplafonds bewerken</div>
            <EditLimitsDialog
              municipality={editDialogPermit.municipality}
              provider_system_id={editDialogPermit.operator_system_id}
              vehicle_type={editDialogPermit.voertuigtype}
              settingsTable={mockSettingstable}
              mode={mode}
              onOk={handleEditDialogOk}
              onCancel={handleCloseEditDialog}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Permits;
