const didFetchSucceed = (response) => response.status >= 200 && response.status <= 299;

const getFetchOptions = (token?) => {
  if(token) {
    return {
      headers: {
        // "authorization": `Bearer ${token}`,
        "authorization": `Bearer ${process.env.REACT_APP_MDS_TEST_TOKEN}`,
        "Content-Type": "application/json",
        "charset": "utf-8"
      }
    }
  }
  return {
    headers: {
      "Content-Type": "application/json",
      "charset": "utf-8"
    }
  }
}

export const putZone = async (token, data) => {
  const url = `${process.env.REACT_APP_MDS_TEST_URL}/admin/zone`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'PUT',
    body: JSON.stringify(data)
  }));
  return await response.json();
}
