import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PermitsCard from './PermitsCard';
import EditLimitsDialog from './EditLimitsDialog';
import SelectProviderDialog from './SelectProviderDialog';
import moment from 'moment';
import { StateType } from '../../types/StateType';

import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';
import { addPermitLimit, updatePermitLimit, getPermitLimitOverviewForMunicipality, PERMIT_LIMITS_NIET_ACTIEF } from '../../api/permitLimits';
import type { PermitRecord, PermitLimitData } from '../../api/permitLimits';
import { fetchOperators, type OperatorData } from '../../api/operators';

const Permits = () => {
  const aanbieders = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.aanbieders) ? state.metadata.aanbieders : [];
  });

  const activeorganisation = useSelector((state: StateType) => state.filter.gebied);
  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types);  

  const [permits, setPermits] = useState<PermitRecord[]>([]);

  //const [mockSettingstable, setMockSettingstable] = useState<settingsrow[]>([]);
  const [availableOperators, setAvailableOperators] = useState<OperatorData[]>([]);

  const token = useSelector((state: StateType) => (state.authentication && state.authentication.user_data && state.authentication.user_data.token)||null)
  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);

  const isAdmin = () => acl.is_admin === true;
  const isOrganisationAdmin = () => acl.privileges && acl.privileges.indexOf('ORGANISATION_ADMIN') > -1;

  useEffect(() => {
    fetchOperators().then((operators) => {
      if(operators) {
        setAvailableOperators(operators);
      }
    });
  }, [activeorganisation]);

  // Helper to reload permits

  const reloadPermits = useCallback(async () => {
    const results = await getPermitLimitOverviewForMunicipality(token, activeorganisation);
    setPermits(results);
  }, [token, activeorganisation]);

  useEffect(() => {
    reloadPermits();
  }, [availableOperators, activeorganisation, voertuigtypes, aanbieders, token, reloadPermits]);

    // If user is admin, set mode to admin
    useEffect(() => {
    if(isAdmin() || isOrganisationAdmin()) {
      setMode('admin');
    } else {
      setMode('normal');
    }
  }, [permits, aanbieders]);

  const [selectProviderModality, setSelectProviderModality] = useState<string | null>(null);
  const [editDialogPermit, setEditDialogPermit] = useState<PermitRecord | null>(null);

  // Admin/normal mode toggle
  const [mode, setMode] = useState<'normal' | 'admin'>('normal');

  // Handler to open edit dialog
  const handleEditLimits = (permit: PermitRecord) => {
    setEditDialogPermit(permit);
  };

  // Handler to close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogPermit(null);
  };

  // Handler for OK (now updates mock data and reloads)
  const handleEditDialogOk = async (formData: PermitLimitData) => {
    if (!editDialogPermit) return;

    // alert(`${formData.permit_limit_id === undefined ? 'create': 'update'}  permit limit record\n${JSON.stringify(formData,null,2)}`);

    let result: false | PermitLimitData = false;
    if(formData.permit_limit_id === undefined) {
      result = await addPermitLimit(token, formData);
    } else {
      alert("update permit limit record" + JSON.stringify(formData,null,2));
      result = await updatePermitLimit(token, formData);
    }

    if(false!==result) {
      setEditDialogPermit(null);
    } else {
      alert("Error adding/updating permit limit");
    }
  };

  // Helper: get providers without a permit for this modality/municipality
  const getAvailableProvidersForModality = (modality: string) => {
    const usedSystemIds = permits
      .filter((permit) => permit.permit_limit.modality === modality)
      .map((permit) => permit.permit_limit.system_id);
    return availableOperators.filter(
      (op) => !usedSystemIds.includes(op.system_id)
    );
  };

  // Handler: open add dialog for modality
  const handleAddPermit = (modality: string) => {
    setSelectProviderModality(modality);
  };

  // Handler: select provider in add dialog
  const handleSelectProvider = (provider: OperatorData) => {
    if (!selectProviderModality) return;
    setEditDialogPermit({
      permit_limit: {
        permit_limit_id: -1, // new
        municipality: activeorganisation,
        system_id: provider.system_id,
        modality: selectProviderModality,
        effective_date: moment().add(1, 'day').format('YYYY-MM-DD'), // tomorrow
        minimum_vehicles: PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles,
        maximum_vehicles: PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles,
        minimal_number_of_trips_per_vehicle: PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle,
        max_parking_duration: PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration,
      },
      // add other fields as needed for PermitRecord, or use defaults/nulls
    } as PermitRecord);
    setSelectProviderModality(null);
  };

  if(activeorganisation === "") {
    return (
      <div>
        <h1 className="text-4xl font-bold mb-8">
          Vergunningseisen
        </h1>
        <span className="text-gray-600">
          Selecteer een plaats om vergunningseisen te bekijken
        </span>
      </div>
    )
  }

  const renderPermitCardsForVoertuigtype = (voertuigtype: {id: string, name: string}) => {
    if(! permits || permits.length === 0) {
      return null;
    }
    const permitsForVoertuigtype = permits.filter((permit) => permit.permit_limit.modality === voertuigtype.id);

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
          <button
            className="ml-2 p-1 rounded bg-green-500 text-white hover:bg-green-600"
            title="Voeg permit toe"
            onClick={() => handleAddPermit(voertuigtype.id)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="7" y="3" width="2" height="10" rx="1" fill="currentColor"/>
              <rect x="3" y="7" width="10" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </h2>
        {/* Cards: flex row, wrap, gap */}
        <div className="flex flex-wrap gap-6">
          {permitsForVoertuigtype.map((permit) => (
            <PermitsCard key={'permits-card-' + permit.permit_limit.permit_limit_id} permit={permit} onEditLimits={() => handleEditLimits(permit)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-4xl font-bold mb-8 flex items-center gap-4">
        Vergunningseisen
      </div>
      
      <div>
        {/* Outer: stack voertuigtypes vertically */}
        {voertuigtypes.map((voertuigtype) => {
          return renderPermitCardsForVoertuigtype(voertuigtype);
        })}
      </div>
      {/* Add Permit: Select Provider Dialog */}
      {selectProviderModality && (
        <SelectProviderDialog
          modality={selectProviderModality}
          availableProviders={selectProviderModality ? getAvailableProvidersForModality(selectProviderModality) : []}
          onSelect={handleSelectProvider}
          onCancel={() => setSelectProviderModality(null)}
        />
      )}
      {/* Edit Limits Modal Dialog */}
      {editDialogPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-2xl">
            <EditLimitsDialog
              token={token}
              municipality={editDialogPermit.permit_limit.municipality}
              provider_system_id={editDialogPermit.permit_limit.system_id}
              vehicle_type={editDialogPermit.permit_limit.modality}
              mode={mode}
              onOk={handleEditDialogOk}
              onCancel={handleCloseEditDialog}
              onHistoryChanged={reloadPermits}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Permits;
