export const getFetchOptions = (token?) => {
    if(token) {
      return {
        headers: {
          "authorization": `Bearer ${token}`,
          // "authorization": `Bearer ${process.env.REACT_APP_MDS_TEST_TOKEN}`,
          "Content-Type": "application/json",
          "charset": "utf-8"
        }
      }
    }
    return {
      headers: {
        "Content-Type": "application/json",
        "charset": "utf-8"
      }
    }
}

export const readable_geotype = (name: string) => {
  if(name === 'stop') return 'Hub';
  if(name === 'no_parking') return 'Verbodsgebied';
  if(name === 'monitoring') return 'Analysegebied';
  return '';
}

export const readable_phase = (name: string) => {
  if(name === 'concept') return 'Concept';
  else if(name === 'active') return 'Actief';
  else if(name === 'retirement_concept') return 'Concept \'te verwijderen\'';
  else if(name === 'committed_concept') return 'Voorgesteld concept';
  else if(name === 'committed_retirement_concept') return 'Voorgesteld concept \'te verwijderen\'';
  else if(name === 'published') return 'Definitief gepland';
  else if(name === 'published_retirement') return 'Definitief gepland \'te verwijderen\'';
  else if(name === 'active') return 'Definitief Actief';
  return name;
}

export const defaultStopProperties = {
  location: {},
  is_virtual: true,
  status: {
      control_automatic: true
  },
  capacity: {
      combined: 50
  }
}

export const getGeoIdForZoneIds = (all_hubs, selected_hub_ids) => {
  if(! all_hubs) return;
  if(! selected_hub_ids) return;

  const geo_ids =
      all_hubs
          .filter(x => selected_hub_ids.indexOf(x.zone_id) > -1)
          .map(x => x.geography_id);

  return geo_ids;
}
