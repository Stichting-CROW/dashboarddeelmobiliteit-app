const admin_api_url: string = `${process.env.REACT_APP_FUSIONAUTH_URL}/api`;

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

// GET /getMailTemplateList
export const getMailTemplateList = async (token) => {
  const url = `${admin_api_url}/message/template`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// GET /message/template/{messageTemplateId}
export const getMailTemplateById = async (token, mailTemplateId) => {
  const url = `${admin_api_url}/message/template/${mailTemplateId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// POST /message/template
// {
//   "messageTemplate": {
//     "data": {
//       "updatedBy": "richard@fusionauth.io"
//     },
//     "defaultTemplate": "Here's your Two Factor Code: ${code}",
//     "localizedTemplates": {
//       "de": "Hier ist Ihr Zwei-Faktoren-Code: ${code}",
//       "es": "Este es su código de dos factores: ${code}"
//     },
//     "name": "Default Two Factor Request",
//     "type": "SMS"
//   }
// }
export const createTemplate = async (token, templateObject) => {
  const url = `${admin_api_url}/message/template`;
  const options = getHeaders(token);
  options.method = 'POST';
  options.body = JSON.stringify(templateObject);
  const response = await fetch(url, options);

  let json;
  try {
    json = await response.json();
    return json;
  } catch(e) {
    console.error('Error creating email template');
    return [];
  }
}

// GET /organisation?organisation_id=1
// export const getOrganisation = async (token, organisationId) => {
//   const url = `${admin_api_url}/organisation?organisation_id=${organisationId}`;
//   const options = getHeaders(token);
//   const response = await fetch(url, options);

//   return await response.json();
// }
