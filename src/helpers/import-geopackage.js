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

export {
  preprocessGeoPackageFile
}
