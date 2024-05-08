export const getFetchOptions = (token?) => {
    if(token) {
      return {
        headers: {
          "authorization": `Bearer ${token}`,
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
  else if(name === 'committed_concept') return 'Vastgesteld concept';
  else if(name === 'committed_retirement_concept') return 'Vastgesteld concept \'te verwijderen\'';
  else if(name === 'published') return 'Definitief gepubliceerd';
  else if(name === 'published_retirement') return 'Definitief gepubliceerd \'te verwijderen\'';
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

const groupZonesPerGeographyType = (zones) => {
  const groupedZones = [
    // First, get all 'monitoring' zones
    zones.filter(x => x.geography_type === 'monitoring'),
    // Next, get all 'no_parking' zones
    zones.filter(x => x.geography_type === 'no_parking'),
    // Next, get all 'stop' zones
    zones.filter(x => x.geography_type === 'stop'),
  ]
  return groupedZones;
}

export const sortZonesInPreferedOrder = (zones) => {
  const groupedZones = groupZonesPerGeographyType(zones);
  let groupedZonesToReturn = [];
  groupedZones[0].forEach(x => {
    groupedZonesToReturn.push(x);
  })
  groupedZones[1].forEach(x => {
    groupedZonesToReturn.push(x);
  })
  groupedZones[2].forEach(x => {
    groupedZonesToReturn.push(x);
  })
  return groupedZonesToReturn;
}

