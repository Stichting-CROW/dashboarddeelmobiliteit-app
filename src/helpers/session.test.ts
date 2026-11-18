import {
  SESSION_IDLE_TIMEOUT_MS,
  getJwtExpiryMs,
  getSessionEndReason,
  isSessionIdle,
  isTokenExpired,
  markActivity,
  readLastActivity,
} from './session';

const base64Url = (value: object) => btoa(JSON.stringify(value))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const makeJwt = (claims: object) => `${base64Url({ alg: 'HS256' })}.${base64Url(claims)}.sig`;

const NOW = 1_700_000_000_000;

describe('getJwtExpiryMs', () => {
  it('reads the exp claim in milliseconds', () => {
    expect(getJwtExpiryMs(makeJwt({ exp: 1_700_000_100 }))).toBe(1_700_000_100_000);
  });

  it('returns null for malformed tokens or tokens without exp', () => {
    expect(getJwtExpiryMs('not-a-jwt')).toBeNull();
    expect(getJwtExpiryMs('a.%%%.c')).toBeNull();
    expect(getJwtExpiryMs(makeJwt({ sub: 'x' }))).toBeNull();
    expect(getJwtExpiryMs(undefined)).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('is true once exp has passed', () => {
    expect(isTokenExpired(makeJwt({ exp: NOW / 1000 - 1 }), NOW)).toBe(true);
    expect(isTokenExpired(makeJwt({ exp: NOW / 1000 + 60 }), NOW)).toBe(false);
  });

  it('is false when the expiry is unknown', () => {
    expect(isTokenExpired('opaque-token', NOW)).toBe(false);
  });
});

describe('isSessionIdle', () => {
  it('is true after the idle timeout', () => {
    expect(isSessionIdle(NOW - SESSION_IDLE_TIMEOUT_MS - 1, NOW)).toBe(true);
    expect(isSessionIdle(NOW - SESSION_IDLE_TIMEOUT_MS + 1000, NOW)).toBe(false);
  });

  it('is false without a recorded activity', () => {
    expect(isSessionIdle(null, NOW)).toBe(false);
  });
});

describe('getSessionEndReason', () => {
  const validToken = makeJwt({ exp: NOW / 1000 + 3600 });

  it('returns null when not logged in', () => {
    expect(getSessionEndReason(null, 0, NOW)).toBeNull();
  });

  it('prefers expired over idle', () => {
    const expiredToken = makeJwt({ exp: NOW / 1000 - 1 });
    expect(getSessionEndReason({ token: expiredToken }, 0, NOW)).toBe('expired');
  });

  it('returns idle after inactivity', () => {
    expect(getSessionEndReason({ token: validToken }, 1, NOW)).toBe('idle');
  });

  it('returns null for an active, valid session', () => {
    expect(getSessionEndReason({ token: validToken }, NOW, NOW)).toBeNull();
  });
});

describe('markActivity / readLastActivity', () => {
  it('round-trips through localStorage', () => {
    markActivity(NOW);
    expect(readLastActivity()).toBe(NOW);
  });
});
