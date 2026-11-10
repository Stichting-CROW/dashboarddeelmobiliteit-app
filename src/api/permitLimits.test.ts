import { dedupeKpiValuesByDate, type OperatorPerformanceIndicatorsResponse } from './permitLimits';

describe('dedupeKpiValuesByDate', () => {
  it('keeps the first value per date and leaves unique dates untouched', () => {
    const response: OperatorPerformanceIndicatorsResponse = {
      performance_indicator_description: [],
      municipality_modality_operators: [
        {
          operator: 'lime',
          form_factor: 'bicycle',
          propulsion_type: 'electric_assist',
          geometry_ref: 'cbs:GM0344',
          kpis: [
            {
              kpi_key: 'minimal_number_of_available_vehicles',
              granularity: 'day',
              values: [
                { date: '2026-11-03', measured: 1358 },
                { date: '2026-11-03', measured: 1309 },
                { date: '2026-11-04', measured: 1430 },
                { date: '2026-11-04', measured: 1404 },
              ],
            },
            {
              kpi_key: 'vehicle_cap',
              granularity: 'day',
              values: [
                { date: '2026-11-03', measured: 1318 },
                { date: '2026-11-04', measured: 1370 },
              ],
            },
          ],
        },
      ],
    };

    const [lime] = dedupeKpiValuesByDate(response).municipality_modality_operators;

    expect(lime.kpis[0].values).toEqual([
      { date: '2026-11-03', measured: 1358 },
      { date: '2026-11-04', measured: 1430 },
    ]);
    expect(lime.kpis[1].values).toEqual(response.municipality_modality_operators[0].kpis[1].values);
  });
});
