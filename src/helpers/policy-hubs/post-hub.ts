import { getFetchOptions } from "./common";

const didFetchSucceed = (response) => response.status >= 200 && response.status <= 299;

export const postHub = async (token, data) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'POST',
    body: JSON.stringify(data)
  }));
  return await response.json();
}
