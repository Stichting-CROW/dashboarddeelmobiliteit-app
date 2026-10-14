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

// GET /data_access/list_received?user_id=example@example.com
// Returns the data access received by a specific user (grants to their
// organisation + grants made directly to that user). Requires admin or
// organisation-admin rights on the backend.
export const getDataAccessReceivedForUser = async (token, userId) => {
  if(! userId) return [];

  const url = `${admin_api_url}/data_access/list_received?user_id=${encodeURIComponent(userId)}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  if(! response.ok) {
    const error: any = new Error(`Failed to load received data access (status ${response.status})`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

// GET /data_access/list_granted/413
export const getDataAccessGranted = async (token, ownerOrganisationId) => {
  const url = `${admin_api_url}/data_access/list_granted/${ownerOrganisationId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

interface DataOwnerOrganisation {
  organisation_id: number;
  name: string;
}

// Build the received-data view for a user by scanning list_granted on data-owner
// organisations. list_received?user_id= does not return user-level grants.
export const getDataAccessGrantedToUser = async (
  token,
  userId: string,
  userOrganisationId: number,
  ownerOrganisations: DataOwnerOrganisation[]
) => {
  if (!userId || !ownerOrganisations || ownerOrganisations.length === 0) return [];

  const grantLists = await Promise.all(
    ownerOrganisations.map(async (org) => {
      try {
        const granted = await getDataAccessGranted(token, org.organisation_id);
        if (!Array.isArray(granted)) return [];
        return granted
          .filter((entry: any) => (
            entry.granted_user_id === userId
            || entry.granted_organisation_id === userOrganisationId
          ))
          .map((entry: any) => ({
            ...entry,
            owner_organisation_id: org.organisation_id,
            owner_organisation_name: org.name,
          }));
      } catch (err) {
        console.error('Error loading granted data access for organisation', org.organisation_id, err);
        return [];
      }
    })
  );

  return grantLists
    .flat()
    .filter((entry: any) => entry.owner_organisation_id && entry.owner_organisation_id !== userOrganisationId);
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
