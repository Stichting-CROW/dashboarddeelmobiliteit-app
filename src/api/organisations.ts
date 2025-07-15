import { OrganisationType } from '../types/OrganisationType';

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

// POST /organisation/create
// {
//     "name": "Rotterdam",
//     "type_of_organisation": "MUNICIPALITY",
//     "data_owner_of_municipalities": ["GM0599"]
// }
export const createOrganisation = async (token, organisationObject) => {
  const url = `${admin_api_url}/organisation/create`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify(organisationObject);
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

  const organisation = await response.json() as OrganisationType;
  console.log('*** organisation', organisation)
  return organisation;
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
export const updateOrganisation = async (token, organisationObject) => {
  const url = `${admin_api_url}/organisation/update`;
  const options = getHeaders(token);
  options.method = 'PUT';
  options.body = JSON.stringify(organisationObject);
  const response = await fetch(url, options);

  return await response.json();
}

// DELETE /organisation/delete/11
export const deleteOrganisation = async (token, organisationId) => {
  const url = `${admin_api_url}/organisation/delete/${organisationId}`;
  const options = getHeaders(token); options.method = 'DELETE';
  const response = await fetch(url, options);

  return response;
}

// GET /organisation/list
export const getOrganisationList = async (token) => {
  const url = `${admin_api_url}/organisation/list`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// GET /organisation/yearly_cost_overview?reference_date=YYYY-MM-DD
export const getYearlyCostOverview = async (token, referenceDate) => {
  if(! referenceDate) return;

  const url = `${admin_api_url}/organisation/yearly_cost_overview?reference_date=${referenceDate}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.blob().then( blob => {
    // var file = window.URL.createObjectURL(blob);
    // window.location.assign(file);
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = `crow-dd-jaarbijdrage-${referenceDate}.xlsx`;
    a.click();
  });
}
