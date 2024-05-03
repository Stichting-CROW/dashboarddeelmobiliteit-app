const getHeaders = (token): {
  method?: any,
  mode?: any,
  body?: any,
  headers: any,
} => {
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
  phase,
  visible_layers
}) => {
  let url = `https://mds.test.dashboarddeelmobiliteit.nl/${token ? 'admin' : 'public'}/zones`+
              `?municipality=${municipality}`;
  // Add phases to URL
  visible_layers.forEach(layer => {
    // Don't have duplicates
    if(url.indexOf(`&phases=${layer.split('-')[1]}`) > -1) return;
    const phase_name = layer.split('-')[1];
    if(phase_name) {
      // Add phase to URL
      url += `&phases=${phase_name}`;
    }
});

  // If concept phase is visible: Show retirement concepts as well (hubs based on a previously published hub)
  url += visible_layers.indexOf('concept') ? '&phases=retirement_concept' : '';
  // // Same for retirement committed concepts
  url += visible_layers.indexOf('committed_concept') ? '&phases=committed_retirement_concept' : '';
  // // Same for retirement published concepts
  url += visible_layers.indexOf('published') ? '&phases=published_retirement' : '';

  const options = token ? getHeaders(token) : {};
  const response = await fetch(url, options);
  const json = await response.json();

  return json;
}
