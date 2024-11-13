const preprocessGeoPackageFile = async ({
  token,
  gm_code,
  body
}) => {
  const response = await fetch(`${process.env.REACT_APP_MDS_URL}/admin/gpkg/import?municipality=${gm_code}`, {
    method: "POST",
    body,
    headers: {
      // 'Content-Type': 'application/json',
      'charset': 'utf-8',
      'Authorization': `Bearer ${token}`
    }
  });

  const json = await response.json();

  return json;

}

const importGeoPackageFile = async ({
  token,
  gm_code,
  body
}) => {
  const response = await fetch(`${process.env.REACT_APP_MDS_URL}/admin/bulk_insert_zones`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      // 'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    }
  });

  const json = await response.json();

  return json;
}

export {
  preprocessGeoPackageFile,
  importGeoPackageFile
}
