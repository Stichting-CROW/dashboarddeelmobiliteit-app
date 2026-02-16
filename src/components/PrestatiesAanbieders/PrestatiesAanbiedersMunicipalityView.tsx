import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import '../../styles/permits.css';
import PrestatiesAanbiederCard from './PrestatiesAanbiederCard';
import SelectProviderDialog from './SelectProviderDialog';
import SelectVehicleTypeDialog from './SelectVehicleTypeDialog';
import PermitCardCollection, { type RowData } from './PermitCardCollection';
import { usePermitData } from './usePermitData';
import { usePermitActions } from './usePermitActions';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';
import { StateType } from '../../types/StateType';
import type { PermitLimitRecord, PerformanceIndicatorDescription, GeometryOperatorModalityLimit } from '../../api/permitLimits';
import {
  PERMIT_LIMITS_NIET_ACTIEF,
  getGeometryOperatorModalityLimitHistory,
  getOperatorPerformanceIndicators,
  toGeometryRef,
} from '../../api/permitLimits';
import type { OperatorData } from '../../api/operators';
import { getProvider } from '../../helpers/providers.js';
import { isDemoMode } from '../../config/demo';
import { getDemoOperatorName } from '../../helpers/demoMode';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';
import PageTitle from '../common/PageTitle';
import Modal from '../Modal/Modal.jsx';
import EditLimitsDialog from './EditLimitsDialog';
import KpiOverviewTestDialog from './KpiOverviewTestDialog';
import type { HistoryTableRow } from './permitLimitsUtils';
import { flattenLimitHistoryToTableRows } from './permitLimitsUtils';

interface PrestatiesAanbiedersMunicipalityViewProps {  
  activeorganisation?: string;
}

const PrestatiesAanbiedersMunicipalityView = ({activeorganisation = ''}: PrestatiesAanbiedersMunicipalityViewProps) => {
  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types);
  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden || []);

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
    handleMainAddClick,
    handleMainAddSelectProvider,
    handleMainAddSelectVehicleType,
    handleMainAddCancel,
    updateMode,
  } = usePermitActions(reloadPermits);

  // State for View dialog
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [limitHistory, setLimitHistory] = useState<GeometryOperatorModalityLimit[] | null>(null);
  const [kpiDescriptions, setKpiDescriptions] = useState<PerformanceIndicatorDescription[]>([]);
  const [tableRows, setTableRows] = useState<HistoryTableRow[]>([]);
  // Store permit info separately so dialogs can render even when editDialogPermit is cleared
  const [currentPermitInfo, setCurrentPermitInfo] = useState<{ municipality: string; provider_system_id: string; vehicle_type: string; propulsion_type: string } | null>(null);
  // Track if we're changing provider from the edit dialog (to keep vehicle type)
  const [isChangingProvider, setIsChangingProvider] = useState(false);
  // Store vehicle type when changing provider (since currentPermitInfo gets cleared)
  const [preservedVehicleType, setPreservedVehicleType] = useState<string | null>(null);
  const [preservedMunicipality, setPreservedMunicipality] = useState<string | null>(null);
  // Track if we should keep selection dialog backdrop visible until edit dialog is ready
  const [keepSelectionBackdrop, setKeepSelectionBackdrop] = useState(false);
  const [showKpiTestDialog, setShowKpiTestDialog] = useState(false);

  // Load data when editDialogPermit changes
  useEffect(() => {
    if (editDialogPermit && token) {
      if (!editDialogPermit.propulsion_type) {
        alert('Geen propulsion_type – bewerken niet mogelijk.');
        handleCloseEditDialog();
        return;
      }
      const loadData = async () => {
        const municipality = editDialogPermit!.permit_limit.municipality;
        const provider_system_id = editDialogPermit!.permit_limit.system_id;
        const vehicle_type = editDialogPermit!.permit_limit.modality;
        const propulsion_type = editDialogPermit!.propulsion_type!;
        const geometry_ref = toGeometryRef(municipality);

        // Store permit info so dialogs can render even if editDialogPermit is cleared
        setCurrentPermitInfo({ municipality, provider_system_id, vehicle_type, propulsion_type });

        // Fetch history and KPI descriptions
        const [history, kpiData] = await Promise.all([
          getGeometryOperatorModalityLimitHistory(token, provider_system_id, geometry_ref, vehicle_type, propulsion_type),
          getOperatorPerformanceIndicators(token, municipality, provider_system_id, vehicle_type),
        ]);

        const sortedHistory = history ? history.sort((a, b) => moment(a.effective_date).diff(moment(b.effective_date))) : null;
        setLimitHistory(sortedHistory);

        if (kpiData?.performance_indicator_description) {
          setKpiDescriptions(kpiData.performance_indicator_description);
        }

        // Prepare table rows
        const organisationName = gebieden.find((g: any) => g.gm_code === municipality)?.name || municipality;
        const provider = getProvider(provider_system_id);
        const realProviderName = provider?.name || provider_system_id;
        const providerName = isDemoMode() ? getDemoOperatorName(provider_system_id) : realProviderName;
        const vehicleTypeName = getPrettyVehicleTypeName(vehicle_type) || vehicle_type;

        if (sortedHistory && kpiData?.performance_indicator_description) {
          const rows = flattenLimitHistoryToTableRows(sortedHistory, organisationName, providerName, vehicleTypeName, kpiData.performance_indicator_description);
          setTableRows(rows);
        }

        // Show view dialog
        setShowViewDialog(true);
        // Edit dialog is now ready, can close selection dialog backdrop
        setKeepSelectionBackdrop(false);
      };

      loadData();
    } else if (!editDialogPermit) {
      // Close dialogs if editDialogPermit becomes null
      if (!showViewDialog) {
        setShowViewDialog(false);
        setCurrentPermitInfo(null);
      }
      setKeepSelectionBackdrop(false);
    }
  }, [editDialogPermit, token, gebieden, showViewDialog, handleCloseEditDialog]);

  // Handler for record updated (after inline edit or editor save)
  const handleRecordUpdated = async () => {
    if (!token || !currentPermitInfo || !currentPermitInfo.propulsion_type) return;

    const municipality = currentPermitInfo.municipality;
    const geometry_ref = toGeometryRef(municipality);
    const history = await getGeometryOperatorModalityLimitHistory(token, currentPermitInfo.provider_system_id, geometry_ref, currentPermitInfo.vehicle_type, currentPermitInfo.propulsion_type);
    const sortedHistory = history ? history.sort((a, b) => moment(a.effective_date).diff(moment(b.effective_date))) : null;
    setLimitHistory(sortedHistory);

    // Update table rows
    const organisationName = gebieden.find((g: any) => g.gm_code === municipality)?.name || municipality;
    const provider = getProvider(currentPermitInfo.provider_system_id);
    const realProviderName = provider?.name || currentPermitInfo.provider_system_id;
    const providerName = isDemoMode() ? getDemoOperatorName(currentPermitInfo.provider_system_id) : realProviderName;
    const vehicleTypeName = getPrettyVehicleTypeName(currentPermitInfo.vehicle_type) || currentPermitInfo.vehicle_type;

    if (sortedHistory && kpiDescriptions.length > 0) {
      const rows = flattenLimitHistoryToTableRows(sortedHistory, organisationName, providerName, vehicleTypeName, kpiDescriptions);
      setTableRows(rows);
    }

    reloadPermits();
  };

  const handleCloseViewDialog = () => {
    setShowViewDialog(false);
    setCurrentPermitInfo(null);
    handleCloseEditDialog();
  };

  // Handler for provider logo click - return to provider selection
  const handleProviderLogoClick = () => {
    if (!currentPermitInfo) return;
    // Preserve vehicle type and municipality before closing dialog
    setPreservedVehicleType(currentPermitInfo.vehicle_type);
    setPreservedMunicipality(currentPermitInfo.municipality);
    setIsChangingProvider(true);
    handleCloseViewDialog();
    handleMainAddClick();
  };

  // Handler for vehicle type icon click - return to vehicle type selection for current provider
  const handleVehicleTypeIconClick = () => {
    if (!currentPermitInfo) return;
    
    // Find the current provider in availableOperators
    const currentProvider = availableOperators.find(op => op.system_id === currentPermitInfo.provider_system_id);
    
    if (currentProvider) {
      setIsChangingProvider(false);
      handleCloseViewDialog();
      handleMainAddClick();
      handleMainAddSelectProvider(currentProvider);
    }
  };

  // Wrapper for handleMainAddSelectVehicleType to keep backdrop visible
  const handleMainAddSelectVehicleTypeWrapper = (vehicleTypeId: string, municipality: string) => {
    setKeepSelectionBackdrop(true);
    handleMainAddSelectVehicleType(vehicleTypeId, municipality);
  };

  // Override handleMainAddSelectProvider to handle provider change from edit dialog
  const handleProviderSelectFromEdit = (provider: OperatorData) => {
    if (isChangingProvider && preservedVehicleType && preservedMunicipality) {
      // Keep the current vehicle type, just change the provider
      setIsChangingProvider(false);
      setKeepSelectionBackdrop(true);

      // Create a new permit record with the new provider but same vehicle type
      handleEditLimits({
        permit_limit: {
          permit_limit_id: -1, // new
          municipality: preservedMunicipality,
          system_id: provider.system_id,
          modality: preservedVehicleType,
          effective_date: moment().add(1, 'day').format('YYYY-MM-DD'),
          minimum_vehicles: PERMIT_LIMITS_NIET_ACTIEF.minimum_vehicles,
          maximum_vehicles: PERMIT_LIMITS_NIET_ACTIEF.maximum_vehicles,
          minimal_number_of_trips_per_vehicle: PERMIT_LIMITS_NIET_ACTIEF.minimal_number_of_trips_per_vehicle,
          max_parking_duration: PERMIT_LIMITS_NIET_ACTIEF.max_parking_duration,
        },
      } as PermitLimitRecord);
      
      // Reset preserved values (don't close selection dialog yet - backdrop will stay until edit dialog is ready)
      setPreservedVehicleType(null);
      setPreservedMunicipality(null);
    } else {
      // Normal flow - show vehicle type selection
      setIsChangingProvider(false);
      setPreservedVehicleType(null);
      setPreservedMunicipality(null);
      handleMainAddSelectProvider(provider);
    }
  };

  // Update mode when permits change
  useEffect(() => {
    updateMode();
  }, [permits, updateMode]);

  const handleTitleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) setShowKpiTestDialog(true);
  };

  if ((activeorganisation === "")) {
    return (
      <div>
        <span onClick={handleTitleClick} onKeyDown={(e) => e.shiftKey && e.key === 'Enter' && setShowKpiTestDialog(true)} role="button" tabIndex={0} className="select-none cursor-default">
          <PageTitle>
            Prestaties aanbieders
          </PageTitle>
        </span>
        <span className="permits-empty-state">
          Selecteer een gemeente om vergunningseisen te bekijken
        </span>
      </div>
    );
  }

  if (loading && !showViewDialog) {
    return (
      <div>
        <span onClick={handleTitleClick} onKeyDown={(e) => e.shiftKey && e.key === 'Enter' && setShowKpiTestDialog(true)} role="button" tabIndex={0} className="select-none cursor-default">
          <PageTitle>Prestaties aanbieders</PageTitle>
        </span>
        <div className="permits-loading-state">Laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <span onClick={handleTitleClick} onKeyDown={(e) => e.shiftKey && e.key === 'Enter' && setShowKpiTestDialog(true)} role="button" tabIndex={0} className="select-none cursor-default">
          <PageTitle>Prestaties aanbieders</PageTitle>
        </span>
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
  const renderVehicleTypeHeader = (rowItem: RowData) => {
    const name = getPrettyVehicleTypeName(rowItem.id) || 'Onbekend';
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return (
      <div className="flex items-center gap-3 mb-3">
        <img
          src={rowItem.icon}
          alt={capitalized}
          className="permits-vehicle-type-header-img"
        />
        <div className="permits-vehicle-type-header-text">
          {capitalized}
        </div>
      </div>
    );
  };

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
        <PrestatiesAanbiederCard 
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
      <div className="flex items-center flex-start mb-8">
        <span onClick={handleTitleClick} onKeyDown={(e) => e.shiftKey && e.key === 'Enter' && setShowKpiTestDialog(true)} role="button" tabIndex={0} className="select-none cursor-default">
          <PageTitle className="mb-0 mr-4">
            Prestaties aanbieders
          </PageTitle>
        </span>
        {/* <button
          className="permits-add-button"
          title="Voeg nieuwe vergunningseis toe"
          onClick={handleMainAddClick}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round" fill="white"/>
          </svg>
        </button> */}
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
        <Modal
          isVisible={true}
          title="Selecteer aanbieder"
          button1Title=""
          button1Handler={() => {}}
          button2Title="Annuleren"
          button2Handler={() => {
            setKeepSelectionBackdrop(false);
            setIsChangingProvider(false);
            setPreservedVehicleType(null);
            setPreservedMunicipality(null);
            handleMainAddCancel();
          }}
          hideModalHandler={() => {
            setKeepSelectionBackdrop(false);
            setIsChangingProvider(false);
            setPreservedVehicleType(null);
            setPreservedMunicipality(null);
            handleMainAddCancel();
          }}
          config={{ maxWidth: '600px' }}
        >
          <SelectProviderDialog
            modality={null}
            availableProviders={availableOperators}
            onSelect={isChangingProvider ? handleProviderSelectFromEdit : handleMainAddSelectProvider}
            onCancel={() => {
              setKeepSelectionBackdrop(false);
              setIsChangingProvider(false);
              setPreservedVehicleType(null);
              setPreservedMunicipality(null);
              handleMainAddCancel();
            }}
          />
        </Modal>
      )}
      
      {/* Main Add Workflow: Select Vehicle Type Dialog */}
      {(showMainAddDialog && showVehicleTypeSelection) || (keepSelectionBackdrop && !showViewDialog) ? (
        <Modal
          isVisible={(showMainAddDialog && showVehicleTypeSelection) || (keepSelectionBackdrop && !showViewDialog)}
          title="Selecteer voertuigtype"
          button1Title=""
          button1Handler={() => {}}
          button2Title="Annuleren"
          button2Handler={() => {
            setKeepSelectionBackdrop(false);
            handleMainAddCancel();
          }}
          hideModalHandler={() => {
            setKeepSelectionBackdrop(false);
            handleMainAddCancel();
          }}
          config={{ maxWidth: '600px' }}
        >
          {showMainAddDialog && showVehicleTypeSelection ? (
            <SelectVehicleTypeDialog
              vehicleTypes={voertuigtypes}
              onSelect={(vehicleTypeId) => handleMainAddSelectVehicleTypeWrapper(vehicleTypeId, activeorganisation)}
              onCancel={() => {
                setKeepSelectionBackdrop(false);
                handleMainAddCancel();
              }}
            />
          ) : (
            // Empty content when just keeping backdrop visible
            <div style={{ display: 'none' }} />
          )}
        </Modal>
      ) : null}
      
      {/* Edit Permit Limits Dialog */}
      {currentPermitInfo && showViewDialog && token && (
        <EditLimitsDialog
          isVisible={showViewDialog}
          municipality={currentPermitInfo.municipality}
          provider_system_id={currentPermitInfo.provider_system_id}
          vehicle_type={currentPermitInfo.vehicle_type}
          tableRows={tableRows}
          limitHistory={limitHistory}
          kpiDescriptions={kpiDescriptions}
          mode={mode}
          token={token}
          propulsion_type={currentPermitInfo.propulsion_type}
          showPermitLimitsEditor={false}
          onClose={handleCloseViewDialog}
          onRecordUpdated={handleRecordUpdated}
          onProviderClick={handleProviderLogoClick}
          onVehicleTypeClick={handleVehicleTypeIconClick}
        />
      )}

      <KpiOverviewTestDialog
        isVisible={showKpiTestDialog}
        onClose={() => setShowKpiTestDialog(false)}
        token={token}
        municipality={activeorganisation || ''}
      />
    </div>
  );
};

export default PrestatiesAanbiedersMunicipalityView;
