import DemoVehiclesMap, { DurationLegend } from './DemoVehiclesMap';

/**
 * Demo version of the Aanbod map with the "Defecte voertuigen" filter active:
 * only vehicles that the operator reports as non-operational.
 */
function DemoDefectVehiclesMap() {
  return (
    <DemoVehiclesMap
      title="Waar staan defecte voertuigen?"
      description="Voertuigen die door de aanbieder als defect worden gemeld, met een waarschuwingsdriehoek."
      defectOnly={true}
      zoom={13.4}
      footer={
        <div>
          <DurationLegend />
          <div className="mt-1 text-xs text-gray-600">
            Het driehoekje naast de marker geeft aan dat het voertuig defect is.
          </div>
        </div>
      }
    />
  );
}

export default DemoDefectVehiclesMap;
