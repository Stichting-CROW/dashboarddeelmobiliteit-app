const DEFAULT_MDS_URL = 'https://mds.dashboarddeelmobiliteit.nl';

/**
 * MDS API base URL. Falls back to production when REACT_APP_MDS_URL is unset
 * (common in local dev), so fetches do not hit the CRA dev server as HTML.
 */
export const getMdsUrl = (): string => {
  const fromEnv = process.env.REACT_APP_MDS_URL;
  if (fromEnv && fromEnv !== 'undefined') {
    return fromEnv.replace(/\/$/, '');
  }
  return DEFAULT_MDS_URL;
};

export const getMdsPublicUrl = (): string => `${getMdsUrl()}/public`;
