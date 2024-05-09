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

export const export_kml = async (
  token,
  geography_ids
) => {
  if(! token) return;
  if(! geography_ids || geography_ids.length === 0) return;

  let url = `${process.env.REACT_APP_MDS_URL}/kml/export`;

  const options = token ? getHeaders(token) : {};
  const response = await fetch(url, Object.assign({}, options, {
    method: 'POST',
    body: JSON.stringify({
      geography_ids: geography_ids
    })
  }));

  const blob = await response.blob();

  return blob;
}
