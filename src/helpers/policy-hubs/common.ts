import moment from 'moment';

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

export const isHubInPhase = (hub: any, phase: string, visible_layers: any) => {
  // CONCEPT
  if(phase === 'concept') {
    // Is it a hub, and do we want to show hubs?
    if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-concept') > -1) {
      return (hub.phase === 'concept')
        || (hub.phase === 'retirement_concept')
        // TODO: In concept phase, hide retirement_concept phase if there's a follow up committed concept
    }
    else if(hub.geography_type === 'monitoring' && visible_layers.indexOf('monitoring-concept') > -1) {
      return (hub.phase === 'concept')
    }
    else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-concept') > -1) {
      return (hub.phase === 'concept')
        || (hub.phase === 'retirement_concept')
    }
  }

  // COMMITTED CONCEPT
  else if(phase === 'committed_concept') {
    if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-committed_concept') > -1) {
      return (hub.phase === 'committed_concept')
        || (hub.phase === 'committed_retirement_concept')
      ;
    } else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-committed_concept') > -1) {
      return (hub.phase === 'committed_concept')
        || (hub.phase === 'committed_retirement_concept')
      ;
    }
  }

  // PUBLISHED
  else if(phase === 'published') {
    if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-published') > -1) {
      return (hub.phase === 'published')
        || (hub.phase === 'published_retirement')
        // In published phase: only show retirement concept with effective date >= now()
        || (hub.phase === 'retirement_concept' && moment(moment()).isBefore(hub.effective_date))
        ;
    } else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-published') > -1) {
      return (hub.phase === 'published')
        || (hub.phase === 'published_retirement')
        // In published phase: only show retirement concept with effective date >= now()
        // || (hub.phase === 'X' && moment(moment()).isBefore(hub.effective_date))
        ;
    }
  }

  // ACTIVE
  else if(phase === 'active') {
    // Is it a hub, and do we want to show hubs?
    if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-active') > -1) {
      return (hub.phase === 'active')
        // Show retirement concept if hub is not yet retired
        // As long as retirement concepts are not active, these should be still visible in published/active
        || (hub.phase === 'retirement_concept' && moment(hub.effective_date).isBefore(moment()))
        // Show active retirement if hub is retired
        || (hub.phase === 'active_retirement')
        // In active phase: only show retirement concept with effective date < now()
        || (hub.phase === 'committed_retirement_concept' && moment(moment()).isBefore(hub.retire_date))
        || (hub.phase === 'published_retirement' && moment(moment()).isBefore(hub.retire_date))
        ;
    } else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-active') > -1) {
      return (hub.phase === 'active')
        || (hub.phase === 'active_retirement')
        // In active phase: only show retirement concept with effective date < now()
        || (hub.phase === 'committed_retirement_concept' && moment(moment()).isBefore(hub.retire_date))
        || (hub.phase === 'published_retirement' && moment(moment()).isBefore(hub.retire_date))
        ;
    }
    if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-archived') > -1) {
      return (hub.phase === 'archived');
    }
    else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-archived') > -1) {
      return (hub.phase === 'archived');
    }
  }

  // ARCHIVED
  else if(phase === 'archived') {
    if(hub.geography_type === 'stop' && visible_layers.indexOf('hub-archived') > -1) {
      return (hub.phase === 'archived');
    }
    else if(hub.geography_type === 'no_parking' && visible_layers.indexOf('verbodsgebied-archived') > -1) {
      return (hub.phase === 'archived');
    }
  }

  return false;
}
