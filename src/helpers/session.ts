/** Users are logged out after this period without any interaction. */
export const SESSION_IDLE_TIMEOUT_MS = 60 * 48 * 60 * 1000;// After 48 hours (60 minutes times 48)

export const LAST_ACTIVITY_STORAGE_KEY = 'CROWDD_lastActivity';

export type SessionEndReason = 'expired' | 'idle';

interface SessionUserData {
  token?: string;
}

/**
 * Returns the `exp` claim of a JWT in milliseconds, or null if the token
 * can't be decoded or has no expiry.
 */
export const getJwtExpiryMs = (token: string | null | undefined): number | null => {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const claims = JSON.parse(atob(padded));
    return typeof claims.exp === 'number' ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (
  token: string | null | undefined,
  now: number = Date.now()
): boolean => {
  const expiryMs = getJwtExpiryMs(token);
  return expiryMs !== null && expiryMs <= now;
};

export const isSessionIdle = (
  lastActivityMs: number | null,
  now: number = Date.now()
): boolean => {
  if (lastActivityMs === null) return false;
  return now - lastActivityMs > SESSION_IDLE_TIMEOUT_MS;
};

export const getSessionEndReason = (
  userData: SessionUserData | null | undefined,
  lastActivityMs: number | null,
  now: number = Date.now()
): SessionEndReason | null => {
  if (!userData?.token) return null;
  if (isTokenExpired(userData.token, now)) return 'expired';
  if (isSessionIdle(lastActivityMs, now)) return 'idle';
  return null;
};

export const readLastActivity = (): number | null => {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
};

/** Stored in localStorage so activity in one tab keeps the other tabs alive. */
export const markActivity = (now: number = Date.now()): void => {
  localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
};
