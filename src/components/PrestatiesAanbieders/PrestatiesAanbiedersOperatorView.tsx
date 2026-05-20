import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import PrestatiesAanbiederCard from './PrestatiesAanbiederCard';
import '../../styles/permits.css';
import PermitCardCollection, { type RowData } from './PermitCardCollection';
import { usePermitData } from './usePermitData';
import { getPrettyVehicleTypeName } from '../../helpers/vehicleTypes';
import { getVehicleTypeIconAlt, getVehicleTypeIconSrc } from '../../helpers/vehicleTypeIconCommon';
import { StateType } from '../../types/StateType';
import type { PermitLimitRecord } from '../../api/permitLimits';
import PageTitle from '../common/PageTitle';
import {
  buildMunicipalityKpisMapFromPermits,
  computeMunicipalitySortMetrics,
  sortMunicipalityRowData,
} from './permitOverviewSorting';

interface PrestatiesAanbiedersOperatorViewProps {
  activeoperator: string;
}

const PrestatiesAanbiedersOperatorView = ({ activeoperator }: PrestatiesAanbiedersOperatorViewProps) => {
  const {
    permits,
    loading,
    error,
    availableOperators,
    rawKpiOperators,
    performanceIndicatorDescriptions,
  } = usePermitData('operator', activeoperator);

  const gebieden = useSelector((state: StateType) =>
    (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : []
  );

  const municipalityNameByGmCode = useMemo(() => {
    const map = new Map<string, string>();
    gebieden.forEach((g: { gm_code?: string; name?: string }) => {
      if (g.gm_code && g.name) {
        map.set(g.gm_code, g.name);
      }
    });
    return map;
  }, [gebieden]);

  const activeoperatorName =
    availableOperators.find((op) => op.system_id === activeoperator)?.name || 'Onbekende aanbieder';

  const municipalityRowData: RowData[] = useMemo(() => {
    const municipalities = new Map<string, RowData>();
    for (const permit of permits) {
      const gmcode = permit.municipality?.gmcode || permit.permit_limit.municipality;
      if (!gmcode || municipalities.has(gmcode)) continue;
      municipalities.set(gmcode, {
        id: gmcode,
        name: municipalityNameByGmCode.get(gmcode) || permit.municipality?.name || gmcode,
      });
    }
    return Array.from(municipalities.values());
  }, [permits, municipalityNameByGmCode]);

  const sortedMunicipalityRowData = useMemo(() => {
    const kpiMap = buildMunicipalityKpisMapFromPermits(permits, rawKpiOperators);
    const metrics = computeMunicipalitySortMetrics(permits, kpiMap);
    return sortMunicipalityRowData(municipalityRowData, metrics);
  }, [permits, rawKpiOperators, municipalityRowData]);

  const rowIndexById = useMemo(
    () => new Map(sortedMunicipalityRowData.map((row, index) => [row.id, index])),
    [sortedMunicipalityRowData]
  );

  if (!activeoperator) {
    return (
      <div>
        <PageTitle>Prestaties aanbieders</PageTitle>
        <div className="permits-empty-state">Geen aanbieder gevonden voor dit account.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageTitle>Prestaties aanbieders</PageTitle>
        <div className="permits-loading-state">Prestaties aanbieders laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageTitle>Prestaties aanbieders</PageTitle>
        <div className="permits-error-state">Fout: {error}</div>
      </div>
    );
  }

  const renderMunicipalityHeader = (rowItem: RowData) => (
    <div className="permits-vehicle-type-header-text mb-3">{rowItem.name}</div>
  );

  const filterPermitsForMunicipality = (allPermits: PermitLimitRecord[], rowItem: RowData) => {
    return allPermits.filter((permit) => {
      const gmcode = permit.municipality?.gmcode || permit.permit_limit.municipality;
      return gmcode === rowItem.id;
    });
  };

  const renderModalityCards = (rowPermits: PermitLimitRecord[]) => {
    const sortedPermits = [...rowPermits].sort((a, b) => {
      const typeA = a.vehicle_type?.id || a.permit_limit.modality;
      const typeB = b.vehicle_type?.id || b.permit_limit.modality;
      const nameA = getPrettyVehicleTypeName(typeA) || typeA;
      const nameB = getPrettyVehicleTypeName(typeB) || typeB;
      return nameA.localeCompare(nameB, 'nl');
    });

    return sortedPermits.map((permit, index) => {
      const providerName = permit.operator?.name || permit.permit_limit.system_id;
      const formFactor = permit.vehicle_type?.id || permit.permit_limit.modality;
      const vehicleIcon = getVehicleTypeIconSrc(formFactor);

      return (
        <PrestatiesAanbiederCard
          key={`${permit.permit_limit.permit_limit_id}-${permit.municipality.gmcode}-${index}`}
          label={providerName}
          logo={vehicleIcon}
          permit={permit}
          vehicleTypeIcon={vehicleIcon}
          vehicleTypeIconAlt={getVehicleTypeIconAlt(formFactor)}
          scopedSystemId={activeoperator}
          kpiFetchScope="operator"
          overviewKpiOperators={rawKpiOperators}
          overviewKpiDescriptions={performanceIndicatorDescriptions}
        />
      );
    });
  };

  return (
    <div>
      <div className="flex items-center flex-start mb-8">
        <PageTitle className="mb-0 mr-4">Prestaties aanbieders</PageTitle>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Overzicht voor <strong>{activeoperatorName}</strong> per gemeente en voertuigtype.
      </p>

      {permits.length === 0 ? (
        <div className="permits-empty-state">
          Geen prestaties gevonden voor deze aanbieder in de geselecteerde periode.
        </div>
      ) : (
        <div id="permits-container" className="permits-container">
          <PermitCardCollection
            rowData={sortedMunicipalityRowData}
            permits={permits}
            renderHeader={renderMunicipalityHeader}
            renderCards={renderModalityCards}
            filterPermits={filterPermitsForMunicipality}
            compareRows={(a, b) =>
              (rowIndexById.get(a.rowItem.id) ?? 0) - (rowIndexById.get(b.rowItem.id) ?? 0)
            }
          />
        </div>
      )}
    </div>
  );
};

export default PrestatiesAanbiedersOperatorView;
