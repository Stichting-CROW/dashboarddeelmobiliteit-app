import { getFetchOptions } from "./common";

const didFetchSucceed = (response) => response.status >= 200 && response.status <= 299;

export const deleteHub = async (token, geography_id: string) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone/${geography_id}`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'DELETE'
  }));
  let json;
  try {
    json = await response.json();
  } catch(err) {
    // Couldn't convert to json - is no problem
  }
  return json;
}
