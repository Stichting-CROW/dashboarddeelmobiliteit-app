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

// POST /organisation/create
// {
//     "name": "Rotterdam",
//     "type_of_organisation": "MUNICIPALITY",
//     "data_owner_of_municipalities": ["GM0599"]
// }
export const createOrganisation = async (token, organisationObject) => {
  const url = `${admin_api_url}/organisation/create`;
  const options = getHeaders(token); options.method = 'POST';
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(e) {
    console.error('Error creating organisation');
    return [];
  }
}

// GET /organisation
export const getOwnOrganisation = async (token) => {
  const url = `${admin_api_url}/organisation`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// GET /organisation?organisation_id=1
export const getOrganisation = async (token, organisationId) => {
  const url = `${admin_api_url}/organisation?organisation_id=${organisationId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// GET /organisation/details_history/413
export const getOrganisationDetailHistory = async (token, organisationId) => {
  const url = `${admin_api_url}/organisation/details_history/${organisationId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// PUT /organisation/update
// Example data:
// {
//     "organisation_id": 413,
//     "name": "Rotterdam",
//     "type_of_organisation": "MUNICIPALITY",
//     "data_owner_of_municipalities": ["GM0599"],
//     "organisation_details": {"factuuradres": "gvdL 5C", "test": 1223, "test2": {"test43": 5}}
// }
export const updateOrganisation = async (token, organisationId) => {
  const url = `${admin_api_url}/organisation/update`;
  const options = getHeaders(token); options.method = 'PUT';
  const response = await fetch(url, options);

  return await response.json();
}

// DELETE /organisation/delete/11
export const deleteOrganisation = async (token, organisationId) => {
  const url = `${admin_api_url}/organisation/delete/${organisationId}`;
  const options = getHeaders(token); options.method = 'DELETE';
  const response = await fetch(url, options);

  return await response.json();
}

// GET /organisation/list
export const getOrganisationList = async (token) => {
  const url = `${admin_api_url}/organisation/list`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}
