const acl_api_url: string = `${process.env.REACT_APP_MAIN_API_URL}/admin`;

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

// GET /user/acl
export const getAcl = async (token) => {
  const url = `${acl_api_url}/user/acl`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(e) {
    console.error('Error getting ACL');
    return [];
  }
}

// GET /menu/acl
export const getMenuAcl = async (token) => {
  const url = `${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/menu/acl`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(e) {
    console.error('Error getting ACL');
    return [];
  }
}
