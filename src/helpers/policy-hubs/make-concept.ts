import { getFetchOptions } from "./common";

export const makeConcept = async (token, geography_ids) => {
  if(! geography_ids || ! geography_ids[0]) return;

  const url = `${process.env.REACT_APP_MDS_URL}/admin/zones/make_concept`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'POST',
    body: JSON.stringify({
      geography_ids: geography_ids
    })
  }));
  return await response;
}
