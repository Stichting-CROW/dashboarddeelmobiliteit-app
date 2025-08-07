import { getFetchOptions } from "./common";

export const patchHub = async (token, data) => {
  const patchingMultiple = data.geography_ids && data.geography_ids.length > 1;
  const url = `${process.env.REACT_APP_MDS_URL}/admin/zone${patchingMultiple ? '/bulk_edit' : ''}`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'PATCH',
    body: JSON.stringify(data)
  }));
  return await response.json();
}
