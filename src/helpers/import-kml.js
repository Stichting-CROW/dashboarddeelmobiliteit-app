const preprocessKmlFile = async ({
  token,
  body
}) => {

  const response = await fetch("https://mds.dashboarddeelmobiliteit.nl/admin/kml/pre_import?municipality=GM0014", {
    method: "POST",
    body,
    headers: {
      'Authorization': `Bearer ${token}`,
      // "Content-Type": "multipart/form-data"// Removed because: https://stackoverflow.com/a/39281156
    }
  });

  const json = await response.json();

  return json;

}

const importKmlFile = async ({
  token,
  body
}) => {

  const response = await fetch("https://mds.dashboarddeelmobiliteit.nl/admin/bulk_insert_zones", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    }
  });

  const json = await response.json();

  return json;
}

export {
  preprocessKmlFile,
  importKmlFile
}
