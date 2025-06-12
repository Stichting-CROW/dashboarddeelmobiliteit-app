import { ServiceAreaHistoryEvent } from '@/src/types/ServiceAreaHistoryEvent';
import moment from 'moment';

export const loadServiceAreas = async (gebied: string, visible_operators: string[]) => {
  // Fetch service areas and store in state
  return await fetchServiceAreas(gebied, visible_operators);
}
export const loadServiceAreasHistory = async (gebied: string, visible_operators: string[]) => {
  // Fetch service areas history and store in state
  const history = await fetchServiceAreasHistory(gebied, visible_operators);
  return keepOneEventPerDay(history); 
}

export const loadServiceAreaDeltas = async (visible_operators: string[], searchParams: URLSearchParams) => {
  const deltaResponse = await fetchServiceAreaDelta(searchParams.get('version'));
  return deltaResponse;
}

// Function that gets service areas
const fetchServiceAreas = async (gebied: string, visible_operators: string[]) => {
  const operatorsString = visible_operators.map(x => x.toLowerCase().replace(' ', '')).join(',');

  const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area?municipalities=${gebied}&operators=${operatorsString}`;
  const response = await fetch(url);
  const json = await response.json();

  return json;
}

// Function that gets service areas history
const fetchServiceAreasHistory = async (gebied: string, visible_operators: string[]) => {
  const startDate = '2024-10-01';
  const endDate = moment().format('YYYY-MM-DD');

  const operatorsString = visible_operators?.map(x => x.toLowerCase().replace(' ', '')).join(',');

  const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area/history?municipalities=${gebied}&operators=${operatorsString}&start_date=${startDate}&end_date=${endDate}`;
  const response = await fetch(url);
  const json: ServiceAreaHistoryEvent[] = await response.json();

  return json;
}

// Function that gets one specific version with its changes
const fetchServiceAreaDelta = async (service_area_version_id) => {
  const url = `https://mds.dashboarddeelmobiliteit.nl/public/service_area/delta/${service_area_version_id}`;
  const response = await fetch(url);
  const json = await response.json();

  return json;
}

const keepOneEventPerDay = (full_history: ServiceAreaHistoryEvent[]) => {
  // Create a map to store one event per day
  const eventsByDay = new Map<string, ServiceAreaHistoryEvent>();
  
  // Sort events by valid_from date to ensure we process oldest first
  const sortedHistory = [...full_history].sort((a, b) => 
    new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
  );

  // For each event, store only the newest event per day based on valid_from date
  sortedHistory.forEach(event => {
    const dateKey = new Date(event.valid_from).toISOString().split('T')[0];
    if (!eventsByDay.has(dateKey) || new Date(event.valid_from) > new Date(eventsByDay.get(dateKey).valid_from)) {
      eventsByDay.set(dateKey, event);
    }
  });

  // Convert map values back to array
  return Array.from(eventsByDay.values());
}
