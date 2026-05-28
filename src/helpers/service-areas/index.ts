import { ServiceAreaHistoryEvent } from '../../types/ServiceAreaHistoryEvent';
import { ServiceArea } from '../../types/ServiceArea';
import { ServiceAreaDelta } from '../../types/ServiceAreaDelta';
import moment from 'moment';
import { fetchJson } from '../../api/fetchJson';
import { getMdsPublicUrl } from '../mdsUrl';

export const loadServiceAreas = async (
  gebied: string,
  visible_operators: string[]
): Promise<ServiceArea[]> => {
  return await fetchServiceAreas(gebied, visible_operators);
};

export const loadServiceAreasHistory = async (
  gebied: string,
  visible_operators: string[]
): Promise<ServiceAreaHistoryEvent[]> => {
  const history = await fetchServiceAreasHistory(gebied, visible_operators);
  return keepOneEventPerDay(history);
};

export const loadServiceAreaDeltas = async (
  visible_operators: string[],
  searchParams: URLSearchParams
): Promise<ServiceAreaDelta | null> => {
  const versionId = searchParams.get('version');
  if (!versionId) {
    return null;
  }
  return await fetchServiceAreaDelta(versionId);
};

const operatorsQueryParam = (visible_operators: string[] | null | undefined): string | null => {
  if (!visible_operators || visible_operators.length === 0) {
    return null;
  }
  return visible_operators.map((x) => x.toLowerCase().replace(' ', '')).join(',');
};

const fetchServiceAreas = async (
  gebied: string,
  visible_operators: string[]
): Promise<ServiceArea[]> => {
  const operatorsString = operatorsQueryParam(visible_operators);
  if (!gebied || !operatorsString) {
    return [];
  }

  const url = `${getMdsPublicUrl()}/service_area?municipalities=${encodeURIComponent(gebied)}&operators=${encodeURIComponent(operatorsString)}`;

  try {
    return await fetchJson<ServiceArea[]>(url);
  } catch (error) {
    console.error('Failed to load service areas:', error);
    return [];
  }
};

const fetchServiceAreasHistory = async (
  gebied: string,
  visible_operators: string[]
): Promise<ServiceAreaHistoryEvent[]> => {
  const operatorsString = operatorsQueryParam(visible_operators);
  if (!gebied || !operatorsString) {
    return [];
  }

  const startDate = '2024-10-01';
  const endDate = moment().format('YYYY-MM-DD');
  const url = `${getMdsPublicUrl()}/service_area/history?municipalities=${encodeURIComponent(gebied)}&operators=${encodeURIComponent(operatorsString)}&start_date=${startDate}&end_date=${endDate}`;

  try {
    return await fetchJson<ServiceAreaHistoryEvent[]>(url);
  } catch (error) {
    console.error('Failed to load service areas history:', error);
    return [];
  }
};

const fetchServiceAreaDelta = async (
  service_area_version_id: string
): Promise<ServiceAreaDelta | null> => {
  if (!service_area_version_id || service_area_version_id === 'null') {
    return null;
  }

  const url = `${getMdsPublicUrl()}/service_area/delta/${encodeURIComponent(service_area_version_id)}`;

  try {
    return await fetchJson<ServiceAreaDelta>(url);
  } catch (error) {
    console.error('Failed to load service area delta:', error);
    return null;
  }
};

const keepOneEventPerDay = (full_history: ServiceAreaHistoryEvent[]) => {
  const eventsByDay = new Map<string, ServiceAreaHistoryEvent>();

  const sortedHistory = [...full_history].sort(
    (a, b) => new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
  );

  sortedHistory.forEach((event) => {
    const dateKey = new Date(event.valid_from).toISOString().split('T')[0];
    if (
      !eventsByDay.has(dateKey) ||
      new Date(event.valid_from) > new Date(eventsByDay.get(dateKey)!.valid_from)
    ) {
      eventsByDay.set(dateKey, event);
    }
  });

  return Array.from(eventsByDay.values());
};
