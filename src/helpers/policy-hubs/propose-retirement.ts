import { getFetchOptions } from "./common";

export const proposeRetirement = async (token, geography_ids: any) => {
  const url = `${process.env.REACT_APP_MDS_TEST_URL}/admin/zones/propose_retirement`;
  const response = await fetch(url, Object.assign({}, getFetchOptions(token), {
    method: 'POST',
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
