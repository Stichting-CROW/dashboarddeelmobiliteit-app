const acl_api_url: string = 'https://api.deelfietsdashboard.nl/dashboard-api';

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

// GET /menu/acl
export const getAcl = async (token) => {
  const url = `${acl_api_url}/menu/acl`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(e) {
    console.error('Error getting user list');
    return [];
  }
}
