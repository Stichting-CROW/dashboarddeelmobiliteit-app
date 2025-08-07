import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../../styles/permits.css';
import PermitsCard from './PermitsCard';
import EditLimitsDialog from './EditLimitsDialog';
import SelectProviderDialog from './SelectProviderDialog';
import SelectVehicleTypeDialog from './SelectVehicleTypeDialog';
import PermitCardCollection, { type RowData } from './PermitCardCollection';
import { usePermitData } from './usePermitData';
import { usePermitActions } from './usePermitActions';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';
import { StateType } from '../../types/StateType';
import type { PermitLimitRecord } from '../../api/permitLimits';
import { getProvider } from '../../helpers/providers.js';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';

interface PermitsMunicipalityViewProps {  
  activeorganisation?: string;
}

const PermitsMunicipalityView = ({activeorganisation = ''}: PermitsMunicipalityViewProps) => {
  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types);

  // Use the generic data hook
  const { permits, loading, error, reloadPermits, token, availableOperators } = usePermitData('municipality', activeorganisation);
  
  // Use the generic actions hook
  const {
    editDialogPermit,
    showMainAddDialog,
    // selectedProviderForMainAdd,
    showVehicleTypeSelection,
    mode,
    handleEditLimits,
    handleCloseEditDialog,
    handleEditDialogOk,
    handleMainAddClick,
    handleMainAddSelectProvider,
    handleMainAddSelectVehicleType,
    handleMainAddCancel,
    updateMode,
  } = usePermitActions(reloadPermits);

  // Update mode when permits change
  useEffect(() => {
    updateMode();
  }, [permits]); // Remove updateMode from dependencies to prevent infinite loop

  if ((activeorganisation === "")) {
    return (
      <div>
        <h1 className="permits-page-title">
          Vergunningseisen
        </h1>
        <span className="permits-empty-state">
          Selecteer een gemeente om vergunningseisen te bekijken
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="permits-page-title">Vergunningseisen</h1>
        <div className="permits-loading-state">Laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="permits-page-title">Vergunningseisen</h1>
        <div className="permits-error-state">Fout: {error}</div>
      </div>
    );
  }

  // Convert voertuigtypes to RowData format
  const rowData: RowData[] = voertuigtypes.map((voertuigtype) => ({
    id: voertuigtype.id,
    name: voertuigtype.name,
    icon: getVehicleIconUrl(voertuigtype.id) || getVehicleIconUrl('other'),
  }));

  // Render header for vehicle type rows
  const renderVehicleTypeHeader = (rowItem: RowData) => (
    <>
      <img
        src={rowItem.icon}
        alt={rowItem.name}
        className="permits-vehicle-type-header-img"
      />
      <div className="permits-vehicle-type-header-text">
        {getPrettyVehicleTypeName(rowItem.id) || `Onbekend`}
      </div>
    </>
  );

  // Filter permits for vehicle type rows
  const filterVehicleTypePermits = (permits: PermitLimitRecord[], rowItem: RowData) => {
    return permits.filter((permit) => {
      return permit.vehicle_type && permit.vehicle_type.id === rowItem.id;
    });
  };

  // Render cards for vehicle type rows
  const renderVehicleTypeCards = (permits: PermitLimitRecord[], rowItem: RowData) => {
    // Filter out invalid permits
    const validPermits = permits.filter(permit => 
      permit && 
      permit.permit_limit && 
      permit.permit_limit.permit_limit_id
    );

    // Sort permits by provider name
    const sortedPermits = validPermits.sort((a, b) => {
      const nameA = a.operator?.name ? a.operator.name : a.permit_limit.system_id;
      const nameB = b.operator?.name ? b.operator.name : b.permit_limit.system_id;
      return nameA.localeCompare(nameB);
    });

    return sortedPermits.map((permit) => { 
      const provider = getProvider(permit.permit_limit.system_id); // get this from the PermitLimitRecord later?

      const providerName = permit.operator ? permit.operator.name : permit.permit_limit.system_id;
      const providerLogo = provider ? provider.logo : createSvgPlaceholder({
          width: 48,
          height: 48,
          text: provider?.name.slice(0, 2),
          bgColor: '#0F1C3F',
          textColor: '#7FDBFF',
      });
  
      return (
        <PermitsCard 
          label={providerName}
          logo={providerLogo}
          key={'permits-card-' + permit.permit_limit.permit_limit_id} 
          permit={permit} 
          onEditLimits={() => handleEditLimits(permit)} 
        />
    )});
  };

  return (
    <div>
      <div className="permits-page-title">
        Vergunningseisen
        <button
          className="permits-add-button"
          title="Voeg nieuwe vergunningseis toe"
          onClick={handleMainAddClick}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round" fill="white"/>
          </svg>
        </button>
      </div>
      
      <div id="permits-container" className="permits-container">
        <PermitCardCollection
          rowData={rowData}
          permits={permits}
          renderHeader={renderVehicleTypeHeader}
          renderCards={renderVehicleTypeCards}
          filterPermits={filterVehicleTypePermits}
        />
      </div>

      {/* Add Permit: Select Provider Dialog */}
      {showMainAddDialog && !showVehicleTypeSelection && (
        <SelectProviderDialog
          modality={null}
          availableProviders={availableOperators}
          onSelect={handleMainAddSelectProvider}
          onCancel={handleMainAddCancel}
        />
      )}
      
      {/* Main Add Workflow: Select Vehicle Type Dialog */}
      {showMainAddDialog && showVehicleTypeSelection && (
        <SelectVehicleTypeDialog
          vehicleTypes={voertuigtypes}
          onSelect={(vehicleTypeId) => handleMainAddSelectVehicleType(vehicleTypeId, activeorganisation)}
          onCancel={handleMainAddCancel}
        />
      )}
      
      {/* Edit Limits Modal Dialog */}
      {editDialogPermit && (
        <div className="permits-modal-overlay">
          <div className="permits-modal-content">
            <EditLimitsDialog
              token={token}
              municipality={editDialogPermit.permit_limit.municipality}
              provider_system_id={editDialogPermit.permit_limit.system_id}
              vehicle_type={editDialogPermit.permit_limit.modality}
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

export default PermitsMunicipalityView;
