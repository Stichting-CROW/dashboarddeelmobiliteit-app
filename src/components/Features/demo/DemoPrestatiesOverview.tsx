import { useMemo } from 'react';

import '../../../styles/permits.css';

import DemoWidgetCard from './DemoWidgetCard';
import { demoOperators } from './demoData';
import ProviderLabel from '../../PrestatiesAanbieders/ProviderLabel';
import PerformanceIndicator from '../../PrestatiesAanbieders/PerformanceIndicator';
import type {
  PerformanceIndicatorDescription,
  PerformanceIndicatorKPI
} from '../../../api/permitLimits';

const PERIOD_IN_DAYS = 14;

const kpiDescriptions: PerformanceIndicatorDescription[] = [
  {
    kpi_key: 'unrented_vehicles',
    bound: 'max',
    unit: 'voertuigen',
    title: 'Aantal onverhuurde voertuigen',
    description: 'Voertuigen die de hele dag niet verhuurd zijn.',
    bound_description: 'Maximaal toegestaan volgens de vergunning.'
  },
  {
    kpi_key: 'vehicles_in_no_parking',
    bound: 'max',
    unit: 'voertuigen',
    title: 'Voertuigen in verbodsgebieden',
    description: 'Voertuigen die geparkeerd stonden in een verbodsgebied.',
    bound_description: 'Maximaal toegestaan volgens de vergunning.'
  },
  {
    kpi_key: 'parking_duration_1_day',
    bound: 'max',
    unit: 'voertuigen',
    title: 'Parkeerduur > 1 dag',
    description: 'Voertuigen die langer dan een dag onverhuurd stilstonden.',
    bound_description: 'Maximaal toegestaan volgens de vergunning.'
  },
  {
    kpi_key: 'parking_duration_7_days',
    bound: 'max',
    unit: 'voertuigen',
    title: 'Parkeerduur > 7 dagen',
    description: 'Voertuigen die langer dan een week onverhuurd stilstonden.',
    bound_description: 'Maximaal toegestaan volgens de vergunning.'
  }
];

/** Share of days the operator meets the requirement, per KPI and per operator. */
const complianceProfiles: Record<string, number[]> = {
  deelfiets_noord: [0.93, 1, 0.86, 0.79],
  stadsfiets_nederland: [0.71, 0.93, 0.64, 0.5]
};

function buildKpis(operatorKey: string): PerformanceIndicatorKPI[] {
  const profile = complianceProfiles[operatorKey] || [0.8, 0.8, 0.8, 0.8];

  return kpiDescriptions.map((description, kpiIndex) => {
    const threshold = [40, 5, 25, 10][kpiIndex];
    const compliesRatio = profile[kpiIndex];

    const values = Array.from({ length: PERIOD_IN_DAYS }, (_, dayIndex) => {
      const date = new Date(Date.UTC(2026, 5, 1 + dayIndex));
      // Spread the days that do not comply evenly over the period.
      const complies = (dayIndex * compliesRatio) % 1 >= 1 - compliesRatio;
      const measured = complies
        ? Math.round(threshold * 0.55)
        : Math.round(threshold * 1.25);

      return {
        date: date.toISOString().slice(0, 10),
        measured,
        threshold,
        complies
      };
    });

    return { kpi_key: description.kpi_key, granularity: 'day', values };
  });
}

/**
 * Demo version of the Prestaties aanbieders overview: one card per aanbieder
 * with the performance indicators of the past two weeks. Green means the
 * requirement was met that day, red means it was not.
 */
function DemoPrestatiesOverview() {
  const cards = useMemo(
    () =>
      demoOperators.slice(0, 2).map((operator) => ({
        operator,
        kpis: buildKpis(operator.system_id)
      })),
    []
  );

  return (
    <DemoWidgetCard
      title="Overzicht prestaties aanbieders"
      description="Per aanbieder zie je in één oogopslag of de vergunningseisen gehaald werden. Elke balk vat twee weken samen."
      footer={
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <div className="flex items-center">
            <span
              className="mr-1 inline-block rounded-sm border border-gray-300"
              style={{ width: 12, height: 12, backgroundColor: '#48E248' }}
            />
            Voldeed aan de eis
          </div>
          <div className="flex items-center">
            <span
              className="mr-1 inline-block rounded-sm border border-gray-300"
              style={{ width: 12, height: 12, backgroundColor: '#FD3E48' }}
            />
            Voldeed niet
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-4">
        {cards.map(({ operator, kpis }) => (
          <div
            key={operator.system_id}
            className="permits-card"
            style={{ minWidth: 0, flex: '1 1 300px' }}
          >
            <div className="permits-card-content">
              <ProviderLabel label={operator.name} color={operator.color} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {kpis.map((kpi) => (
                <PerformanceIndicator
                  key={kpi.kpi_key}
                  kpi={kpi}
                  performanceIndicatorDescriptions={kpiDescriptions}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DemoWidgetCard>
  );
}

export default DemoPrestatiesOverview;
