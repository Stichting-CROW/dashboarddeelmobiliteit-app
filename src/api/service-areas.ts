const API_URL: string = `${process.env.REACT_APP_MDS_URL}/public`;

export const getAvailableOperators = async (municipality: string) => {
  const url = `${API_URL}/service_area/available_operators?municipalities=${municipality}`;
  const response = await fetch(url);
  return await response.json();
}

