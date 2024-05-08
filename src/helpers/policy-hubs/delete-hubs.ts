import { getFetchOptions } from "./common";

const didFetchSucceed = (response) => response.status >= 200 && response.status <= 299;

export const deleteHubs = async (token, geography_ids: any) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone/${geography_ids}`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'DELETE',
    body: JSON.stringify({
      "geography_ids": geography_ids
    })
  }));
  let json;
  try {
    json = await response.json();
  } catch(err) {
    // Couldn't convert to json - is no problem
  }
  return json;
}
