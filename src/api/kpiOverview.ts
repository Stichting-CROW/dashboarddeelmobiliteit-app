import {
  buildKpiOverviewSearchParams,
  fetchKpiOverviewRaw,
  type KpiOverviewQueryScope,
} from './permitLimits';

export interface KpiOverviewParams {
  start_date: string;
  end_date: string;
  municipality?: string;
  form_factor?: string;
  system_id?: string;
  scope?: KpiOverviewQueryScope;
}

export const getKpiOverviewOperators = async (token: string, params: KpiOverviewParams) => {
  const searchParams = buildKpiOverviewSearchParams(params.start_date, params.end_date, {
    scope: params.scope,
    municipality: params.municipality,
    system_id: params.system_id,
    form_factor: params.form_factor,
  });

  if (!searchParams) {
    throw new Error('KPI overview request missing required query params');
  }

  // Route through the shared raw fetcher so this request participates in the
  // in-flight dedup cache used by usePermitData / fetchKpiOverviewPermitRecords.
  // When the page loads with all filter params pre-filled, the overview and
  // the details panel kick off the same URL concurrently and now share a
  // single network call instead of issuing two.
  const scopeLabel = params.municipality || params.system_id || 'unknown';
  const responseJson = await fetchKpiOverviewRaw(token, searchParams, scopeLabel);

  if (!responseJson) {
    throw new Error('Failed to fetch kpi_overview_operators');
  }

  return responseJson;
};
