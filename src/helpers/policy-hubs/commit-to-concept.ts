import { getFetchOptions } from "./common";

export const commit_to_concept = async (token, data) => {
  if(! data) return;
  if(! data.geography_ids) return;
  if(! data.publish_on) return;
  if(! data.effective_on) return;
  
  const url = `${process.env.REACT_APP_MDS_TEST_URL}/admin/zones/publish`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'POST',
    body: JSON.stringify({
      "geography_ids": data.geography_ids,
      "publish_on": data.publish_on,
      "effective_on": data.effective_on
    })
  }));
  return response;
}
