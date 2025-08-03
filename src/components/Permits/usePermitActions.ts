import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';
import { 
  addPermitLimit, 
  updatePermitLimit, 
  type PermitLimitRecord, 
  type PermitLimitData,
  PERMIT_LIMITS_NIET_ACTIEF 
} from '../../api/permitLimits';
import { type OperatorData } from '../../api/operators';
import moment from 'moment';

export const usePermitActions = (reloadPermits: () => Promise<void>) => {
  const token = useSelector((state: StateType) => 
    (state.authentication && state.authentication.user_data && state.authentication.user_data.token) || null
  );
  const acl = useSelector((state: StateType) => state.authentication?.user_data?.acl);

  // Dialog states
  const [editDialogPermit, setEditDialogPermit] = useState<PermitLimitRecord | null>(null);
  const [showMainAddDialog, setShowMainAddDialog] = useState(false);
  const [selectedProviderForMainAdd, setSelectedProviderForMainAdd] = useState<OperatorData | null>(null);
  const [showVehicleTypeSelection, setShowVehicleTypeSelection] = useState(false);

  // Mode state
  const [mode, setMode] = useState<'normal' | 'admin'>('normal');

  // Handler to open edit dialog
  const handleEditLimits = useCallback((permit: PermitLimitRecord) => {
    setEditDialogPermit(permit);
  }, []);

  // Handler to close edit dialog
  const handleCloseEditDialog = useCallback(() => {
    setEditDialogPermit(null);
  }, []);

  // Handler for OK (updates data and reloads)
  const handleEditDialogOk = useCallback(async (formData: PermitLimitData) => {
    if (!editDialogPermit) return;

    let result: false | PermitLimitData = false;
    if (formData.permit_limit_id === undefined) {
      result = await addPermitLimit(token, formData);
    } else {
      result = await updatePermitLimit(token, formData);
    }

    if (result !== false) {
      setEditDialogPermit(null);
      await reloadPermits();
    } else {
      alert("Error adding/updating permit limit");
    }
  }, [editDialogPermit, token, reloadPermits]);

  // New handlers for main + button workflow
  const handleMainAddClick = useCallback(() => {
    setShowMainAddDialog(true);
    setSelectedProviderForMainAdd(null);
    setShowVehicleTypeSelection(false);
  }, []);

  const handleMainAddSelectProvider = useCallback((provider: OperatorData) => {
    setSelectedProviderForMainAdd(provider);
    setShowVehicleTypeSelection(true);
  }, []);

  const handleMainAddSelectVehicleType = useCallback((vehicleTypeId: string, municipality: string) => {
    if (!selectedProviderForMainAdd) return;
    
    setEditDialogPermit({
      permit_limit: {
        permit_limit_id: -1, // new
        municipality: municipality,
        system_id: selectedProviderForMainAdd.system_id,
        modality: vehicleTypeId,
        effective_date: moment().add(1, 'day').format('YYYY-MM-DD'), // tomorrow
        minimum_vehicles: PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles,
        maximum_vehicles: PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles,
        minimal_number_of_trips_per_vehicle: PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle,
        max_parking_duration: PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration,
      },
    } as PermitLimitRecord);
    
    // Reset the workflow state
    setShowMainAddDialog(false);
    setSelectedProviderForMainAdd(null);
    setShowVehicleTypeSelection(false);
  }, [selectedProviderForMainAdd]);

  const handleMainAddCancel = useCallback(() => {
    setShowMainAddDialog(false);
    setSelectedProviderForMainAdd(null);
    setShowVehicleTypeSelection(false);
  }, []);

  // Update mode based on ACL
  const updateMode = useCallback(() => {
    const isAdmin = () => acl?.is_admin === true;
    const isOrganisationAdmin = () => acl?.privileges && acl.privileges.indexOf('ORGANISATION_ADMIN') > -1;

    if (isAdmin() || isOrganisationAdmin()) {
      setMode('admin');
    } else {
      setMode('normal');
    }
  }, [acl]);

  return {
    // States
    editDialogPermit,
    showMainAddDialog,
    selectedProviderForMainAdd,
    showVehicleTypeSelection,
    mode,
    
    // Handlers
    handleEditLimits,
    handleCloseEditDialog,
    handleEditDialogOk,
    handleMainAddClick,
    handleMainAddSelectProvider,
    handleMainAddSelectVehicleType,
    handleMainAddCancel,
    updateMode,
  };
}; 