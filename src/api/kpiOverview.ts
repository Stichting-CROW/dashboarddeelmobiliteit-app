const MDS_BASE_URL = 'https://mds.dashboarddeelmobiliteit.nl';

interface KpiOverviewParams {
  start_date: string;
  end_date: string;
  municipality: string;
  form_factor?: string;
  system_id?: string;
}

const getFetchOptions = (token: string) => {
  return {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };
};

export const getKpiOverviewOperators = async (
  token: string,
  params: KpiOverviewParams
) => {
  const searchParams = new URLSearchParams();
  searchParams.append("start_date", params.start_date);
  searchParams.append("end_date", params.end_date);
  searchParams.append("municipality", params.municipality);
  
  if (params.form_factor) {
    searchParams.append("form_factor", params.form_factor);
  }
  
  if (params.system_id) {
    searchParams.append("system_id", params.system_id);
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
