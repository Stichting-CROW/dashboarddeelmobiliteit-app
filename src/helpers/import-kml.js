const preprocessKmlFile = async ({
  token,
  gm_code,
  body
}) => {

  const response = await fetch(`${process.env.REACT_APP_MDS_URL}/admin/kml/pre_import?municipality=${gm_code}`, {
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
  gm_code,
  body
}) => {

  const response = await fetch(`${process.env.REACT_APP_MDS_URL}/admin/bulk_insert_zones`, {
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
