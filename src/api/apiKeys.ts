const admin_api_url: string = 'https://api.dashboarddeelmobiliteit.nl/admin';

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

// POST /apikey/create
export const createApiKey = async (token) => {
  const url = `${admin_api_url}/apikey/create`;
  const options = getHeaders(token);
  options.method = 'POST';
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(e) {
    console.error('Error creating API key');
    return [];
  }
}

// DELETE /apikey/delete?apikey_id=X
export const deleteApiKey = async (token, apiKeyId) => {
  const url = `${admin_api_url}/apikey/delete?apikey_id=${apiKeyId}`;
  const options = getHeaders(token); options.method = 'DELETE';
  const response = await fetch(url, options);

  return response;
}

// GET /apikey/list
export const getApiKeyList = async (token) => {
  const url = `${admin_api_url}/apikey/list`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}
