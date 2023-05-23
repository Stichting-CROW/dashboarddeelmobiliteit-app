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

// GET /user/list
export const getUserList = async (token) => {
  const url = `${admin_api_url}/user/list`;
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

// GET /user/list?organisation_id=1
export const getUserListForOrganisation = async (token, organisationId) => {
  const url = `${admin_api_url}/user/list?organisation_id=${organisationId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// POST /user/create
// Example data:
// {
//     "user_id":         "example@example.com",
//     "privileges":      ["DOWNLOAD_RAW_DATA"],
//     "organisation_id": 9
// }
export const createUser = async (token, userObject) => {
  const url = `${admin_api_url}/user/create`;
  const options = getHeaders(token); options.method = 'POST';
  const response = await fetch(url, options);

  return await response.json();
}

// PUT /user/update
// Example data:
// {
//     "user_id":         "example@example.com",
//     "privileges":      ["DOWNLOAD_RAW_DATA", "ORGANISATION_ADMIN"],
//     "organisation_id": 9
// }
export const updateUser = async (token, userObject) => {
  const url = `${admin_api_url}/user/update`;
  const options = getHeaders(token);
  options.method = 'PUT';
  options.body = JSON.stringify(userObject);
  const response = await fetch(url, options);

  return await response.json();
}

// DELETE /user/delete?user_id=example@example.com (Note: Encode userId)
export const deleteUser = async (token, userId) => {
  const url = `${admin_api_url}/user/delete?user_id=${userId}`;
  const options = getHeaders(token); options.method = 'DELETE';
  const response = await fetch(url, options);

  return await response.json();
}

// GET /user/acl
export const getAcl = async (token) => {
  const url = `${admin_api_url}/user/acl`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}
