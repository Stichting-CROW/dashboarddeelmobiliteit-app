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

// // GET /organisation
// export const getOwnOrganisation = async (token) => {
//   const url = `${admin_api_url}/organisation`;
//   const options = getHeaders(token);
//   const response = await fetch(url, options);

//   return await response.json();
// // }

// // GET /organisation?organisation_id=1
// export const getOrganisation = async (token, organisationId) => {
//   const url = `${admin_api_url}/organisation?organisation_id=${organisationId}`;
//   const options = getHeaders(token);
//   const response = await fetch(url, options);

//   return await response.json();
// }

// // GET /organisation/details_history/413
// export const getOrganisationDetailHistory = async (token, organisationId) => {
//   const url = `${admin_api_url}/organisation/details_history/${organisationId}`;
//   const options = getHeaders(token);
//   const response = await fetch(url, options);

//   return await response.json();
// }

// PUT /organisation/update
// Example data:
// {
//     "organisation_id": 413,
//     "name": "Rotterdam",
//     "type_of_organisation": "MUNICIPALITY",
//     "data_owner_of_municipalities": ["GM0599"],
//     "organisation_details": {"factuuradres": "gvdL 5C", "test": 1223, "test2": {"test43": 5}}
// }
// export const updateOrganisation = async (token, organisationObject) => {
//   const url = `${admin_api_url}/organisation/update`;
//   const options = getHeaders(token);
//   options.method = 'PUT';
//   options.body = JSON.stringify(organisationObject);
//   const response = await fetch(url, options);

//   return await response.json();
// }

// DELETE /apikey/delete?apikey_id=X
export const deleteApiKey = async (token, apiKeyId) => {
  const url = `${admin_api_url}/apikey/delete/?apikey_id=${apiKeyId}`;
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
