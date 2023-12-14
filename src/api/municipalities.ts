const api_url: string = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/public/municipalities`;

const getHeaders = (token): {
  method?: any,
  mode?: any,
  body?: any,
  headers: any,
} => {
  return {
    method: "GET",
    headers: {
      "Authorization":  `Bearer ${token}`,
      "Content-Type": 'application/json'
    }
  };
}

// GET /public/municipalities
export const getMunicipalityList = async (token) => {
  const url = `${api_url}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}
