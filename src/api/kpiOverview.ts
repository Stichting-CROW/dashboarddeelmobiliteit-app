import { buildKpiOverviewSearchParams, type KpiOverviewQueryScope } from './permitLimits';

const MDS_BASE_URL = 'https://mds.dashboarddeelmobiliteit.nl';

export interface KpiOverviewParams {
  start_date: string;
  end_date: string;
  municipality?: string;
  form_factor?: string;
  system_id?: string;
  scope?: KpiOverviewQueryScope;
}

const getFetchOptions = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

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

  const url = `${MDS_BASE_URL}/kpi_overview_operators?${searchParams.toString()}`;

  const fetchOptions = getFetchOptions(token);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const responseJson = await response.json();
  return responseJson;
};
