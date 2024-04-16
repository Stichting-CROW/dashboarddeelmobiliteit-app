import { getFetchOptions } from "./common";

const didFetchSucceed = (response) => response.status >= 200 && response.status <= 299;

export const deleteHub = async (token, geography_id: string) => {
  const url = `${process.env.REACT_APP_MDS_TEST_URL}/admin/zone/${geography_id}`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'DELETE'
  }));
  return await response.json();
}
