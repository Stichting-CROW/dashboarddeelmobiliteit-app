import { fetchJson } from './fetchJson';
import { getMdsPublicUrl } from '../helpers/mdsUrl';

export interface AvailableOperatorsResponse {
  operators_with_service_area: string[];
}

export const getAvailableOperators = async (
  municipality: string | null | undefined
): Promise<AvailableOperatorsResponse | null> => {
  if (!municipality) {
    return null;
  }

  const url = `${getMdsPublicUrl()}/service_area/available_operators?municipalities=${encodeURIComponent(municipality)}`;

  try {
    return await fetchJson<AvailableOperatorsResponse>(url);
  } catch (error) {
    console.error('Failed to load available service area operators:', error);
    return null;
  }
};
