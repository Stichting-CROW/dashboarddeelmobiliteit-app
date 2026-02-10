import { useSelector } from 'react-redux';
import PrestatiesAanbiederCard from './PrestatiesAanbiederCard';
import '../../styles/permits.css';
import PermitCardCollection, { type RowData } from './PermitCardCollection';
import { usePermitData } from './usePermitData';
import { getPrettyVehicleTypeName, getVehicleIconUrl } from '../../helpers/vehicleTypes';
import { StateType } from '../../types/StateType';
import type { PermitLimitRecord } from '../../api/permitLimits';
import createSvgPlaceholder from '../../helpers/create-svg-placeholder';

interface PrestatiesAanbiedersOperatorViewProps {
  activeoperator: string;
}
const PrestatiesAanbiedersOperatorView = ({activeoperator}: PrestatiesAanbiedersOperatorViewProps) => {

  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types);

  // Use the generic data hook for operator view
  const { permits, loading, error, availableOperators } = usePermitData('operator', activeoperator);

  if (availableOperators.length === 0) {
    return (
      <div>
        <h1 className="permits-page-title">Prestaties aanbieders</h1>
        <div className="permits-empty-state">Geen aanbieders beschikbaar</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="permits-page-title">Prestaties aanbieders</h1>
        <div className="permits-loading-state">Prestaties aanbieders laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="permits-page-title">Prestaties aanbieders per aanbieder</h1>
        <div className="permits-error-state">Fout: {error}</div>
      </div>
    );
  }

  // Convert voertuigtypes to RowData format
  const rowData: RowData[] = voertuigtypes
    .map((voertuigtype) => ({
    id: voertuigtype.id,
    name: voertuigtype.name,
    icon: getVehicleIconUrl(voertuigtype.id) || getVehicleIconUrl('other'),
  }));

  // Render header for vehicle type rows
  const renderVehicleTypeHeader = (rowItem: RowData) => (
    <>
      <img
        src={rowItem.icon}
        alt={getPrettyVehicleTypeName(rowItem.id) || `Onbekend`}
        className="permits-vehicle-type-header-img"
      />
    </>
  );

  // Filter permits for specific vehicle type
  const filterVehicleTypePermits = (permits: PermitLimitRecord[], rowItem: RowData) => {
    // For now, return all permits since vehicle type filtering might not be implemented yet
    return permits.filter((permit) => { 
      // dont show if we cant determine the vehicle type
      // in the future, we will have vehicle info in the permits record
      return permit.vehicle_type && permit.vehicle_type.id === rowItem.id;
    });
  };

  // Render vehicle type cards
  const renderVehicleTypeCards = (permits: PermitLimitRecord[], rowItem: RowData) => {
    const filteredPermits = filterVehicleTypePermits(permits, rowItem).sort((a, b) => {
      return a.municipality.name.localeCompare(b.municipality.name);
    });
    
    return filteredPermits.map((permit, index) => { 
      const municipalityName = permit.municipality ? permit.municipality.name : permit.permit_limit.municipality;
      const municipalityLogo = createSvgPlaceholder({
        width: 48,
        height: 48,
        text: municipalityName.slice(0, 2),
        bgColor: '#0F1C3F',
        textColor: '#7FDBFF',
      });
      return(
        <PrestatiesAanbiederCard
          key={`${permit.permit_limit.permit_limit_id}-${permit.municipality.gmcode}-${index}`}
          label={municipalityName}
          logo={municipalityLogo}
          permit={permit}
        />
      )});
  };

  const activeoperatorName = availableOperators.find(op => op.system_id === activeoperator)?.name || 'Onbekende aanbieder';

  const filterPermitsForCollection = (permits: PermitLimitRecord[], rowItem: RowData) => { 
    return permits.filter((permit) => {
      return permit.vehicle_type && permit.vehicle_type.id === rowItem.id;
    });
  }

  return (
    <div>
      <div className="permits-page-title">
        Prestaties aanbieders voor {activeoperatorName}
      </div>
      
      <div className="mb-6">
        {permits.length === 0 && (
          <div className="permits-empty-state">
            Geen vergunningseisen gevonden voor deze operator.
          </div>
        )}
      </div>

      {permits.length > 0 && (
        <PermitCardCollection
          rowData={rowData}
          permits={permits}
          renderHeader={renderVehicleTypeHeader}
          renderCards={renderVehicleTypeCards}
          filterPermits={filterPermitsForCollection}
        />
      )}
    </div>
  );
};

export default PrestatiesAanbiedersOperatorView;