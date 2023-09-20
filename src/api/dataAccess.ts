const admin_api_url: string = `${process.env.REACT_APP_MAIN_API_URL}/admin`;

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

// POST /data_access/grant_user
// {
//     "owner_organisation_id": 1,
//     "granted_user_id": "example@example.com"
// }
export const grantUser = async (token, data) => {
  if(! data.owner_organisation_id) return;
  if(! data.granted_user_id) return;

  const url = `${admin_api_url}/data_access/grant_user`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify(data);
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(err) {
    console.error('Error granting user', err);
    return [];
  }
}

// GET /data_access/list_received
export const getDataAccessReceived = async (token) => {
  const url = `${admin_api_url}/data_access/list_received`;
  const options = getHeaders(token);
  const response = await fetch(url, options);


  return await response.json();
}

// GET /data_access/list_granted/413
export const getDataAccessGranted = async (token, ownerOrganisationId) => {
  const url = `${admin_api_url}/data_access/list_granted/${ownerOrganisationId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// POST /data_access/grant_organisation
// Example data:
// {
//     "owner_organisation_id": 604,
//     "granted_organisation_id": 621
// }
export const grantOrganisation = async (token, data) => {
  if(! data.owner_organisation_id) return;
  if(! data.granted_organisation_id) return;

  const url = `${admin_api_url}/data_access/grant_organisation`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify(data);
  const response = await fetch(url, options);

  return await response.json();
}

// DELETE /data_access/revoke/3
export const revokeDataAccess = async (token, id) => {
  const url = `${admin_api_url}/data_access/revoke/${id}`;
  const options = getHeaders(token); options.method = 'DELETE';
  const response = await fetch(url, options);

  return response;
}
