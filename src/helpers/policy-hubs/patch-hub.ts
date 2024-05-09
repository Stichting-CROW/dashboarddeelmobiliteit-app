import { getFetchOptions } from "./common";

export const patchHub = async (token, data) => {
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'PATCH',
    body: JSON.stringify(data)
  }));
  return await response.json();
}
