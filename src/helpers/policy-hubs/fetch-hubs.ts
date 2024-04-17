const getHeaders = (token): {
  method?: any,
  mode?: any,
  body?: any,
  headers: any,
} => {
  token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ilg4MThOTllZdHBILWxEdWMyMmFPZWJibjYxTSJ9.eyJhdWQiOiIxZGRjODhiMS05NzdhLTRmZWUtOTdjNC1kMmVjOWRlOTc2YjEiLCJleHAiOjE3MTAzNjIyNzgsImlhdCI6MTcxMDM1ODY3OCwiaXNzIjoidGVzdC5kYXNoYm9hcmRkZWVsbW9iaWxpdGVpdC5ubCIsInN1YiI6IjMwMGNhN2E0LWZkNWQtNDA2My1hNGM0LWNiYTA1MDdkOTc4ZCIsImp0aSI6IjAxMjAyMGY0LTM5N2YtNDYzMy1iOGJmLWM3ODcxZTA2MDhhNSIsImF1dGhlbnRpY2F0aW9uVHlwZSI6IlBBU1NXT1JEIiwiZW1haWwiOiJzdmVuLmJvb3JAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFwcGxpY2F0aW9uSWQiOiIxZGRjODhiMS05NzdhLTRmZWUtOTdjNC1kMmVjOWRlOTc2YjEiLCJyb2xlcyI6WyJkZWZhdWx0X3VzZXIiXSwiYXV0aF90aW1lIjoxNzEwMzU4Njc4LCJ0aWQiOiIwYjBhZTVhNy1jOWY0LTU1ZTEtYzQ0Ni0zNzFlNzcwYjBjY2MifQ.eSh2pgEz0c-wRzNfT9AyW0Di6Jhcu68HfK5azDataNKVrGStq_VeJg3K9WTljtTcid5mvcjYL6otldhaHhdBHOjoODtzWnCCgRAnzq8ywqzjHZYf1pegfXmHPMPeD9OXKTpl1ST2k4LYLF78l64V18I87H2Z4hU6jo3x1CUez508OU8YGzS0rwhQ6ZgZS5XYVNLEfJEkntUmm4JJRuqC4-_tlqxhGjLWKbs7ewTmwKWvDnAjsxjqesJq7ew4rdu5KZLDer2lNhoKQ8Fh4FhY9Q2bxNpYokO-RHzIklom3-V2z_cu7F6Pbk3FMzRLK3dOq1rGktjIiQRW246pz1l7Pw';
  return {
    method: "GET",
    headers: {
      "Authorization":  `Bearer ${token}`,
      "Content-Type": 'application/json'
    }
  };
}

export const fetch_hubs = async ({
  token,
  municipality,
  visible_layers
}) => {
  let url = `https://mds.test.dashboarddeelmobiliteit.nl/admin/zones`+
              `?municipality=${municipality}`;
  // Add phases to URL
  visible_layers.forEach(layer => {
    // Don't have duplicates
    if(url.indexOf(`&phases=${layer.split('-')[1]}`) > -1) return;
    // Add phase to URL
    url += `&phases=${layer.split('-')[1]}`;
  });
  // If concept phase is visible: Show retirement concepts as well (hubs based on a previously published hub)
  url += visible_layers.indexOf('concept') ? '&phases=retirement_concept' : '';
  // Same for retirement committed concepts
  url += visible_layers.indexOf('committed_concept') ? '&phases=committed_retirement_concept' : '';
  // Same for retirement published concepts
  url += visible_layers.indexOf('published') ? '&phases=published_retirement' : '';

  const options = getHeaders(token);
  const response = await fetch(url, options);
  const json = await response.json();

  return json;
}
