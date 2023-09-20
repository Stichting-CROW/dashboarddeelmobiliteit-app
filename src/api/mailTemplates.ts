const admin_api_url: string = 'https://auth.deelfietsdashboard.nl/api';

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
  const url = `${admin_api_url}/email/template`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// GET /email/template/{messageTemplateId}
export const getMailTemplateById = async (token, mailTemplateId) => {
  const url = `${admin_api_url}/email/template/${mailTemplateId}`;
  const options = getHeaders(token);
  const response = await fetch(url, options);

  return await response.json();
}

// POST /email/template
// {
//   "emailTemplate": {
//     "defaultFromName": "Administrator",
//     "defaultHtmlTemplate": "<p>Hello ${user.username}</p><p>Welcome To FusionAuth!</p>",
//     "defaultSubject": "Hello World",
//     "defaultTextTemplate": "Hello ${user.username},\nWelcome To FusionAuth!",
//     "fromEmail": "email@example.com",
//     "localizedFromNames": {
//       "de": "Verwalter",
//       "fr": "Administrateur"
//     },
//     "localizedHtmlTemplates": {
//       "de": "<p>Hallo ${user.username}</p><p>Willkommen auf der FusionAuth!<p>",
//       "fr": "<p>Bonjour ${user.username}</p><p>Bienvenue à FusionAuth!<p>"
//     },
//     "localizedSubjects": {
//       "de": "Hallo Welt",
//       "fr": "Bonjour le monde"
//     },
//     "localizedTextTemplates": {
//       "de": "Hallo ${user.username},\nWillkommen auf der FusionAuth!",
//       "fr": "Bonjour ${user.username},\nBienvenue à FusionAuth!"
//     },
//     "name": "Hello World"
//   }
// }
export const createTemplate = async (token, templateObject) => {
  const url = `${admin_api_url}/email/template`;
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
