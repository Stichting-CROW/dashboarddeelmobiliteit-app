import { FeedSummary } from '../../types/FeedType';
import {
  applyCredentials,
  authenticationToValues,
  buildAuthentication,
  buildCreatePayload,
  buildUpdatePayload,
  buildValidateRequest,
  describeChanges,
  emptyFormValues,
  filterFeeds,
  formValuesFromFeed,
  getFeedStatus,
  isRiskyChange,
  maskUrl,
  validateFormValues
} from './feedUtils';

const feed = (overrides: Partial<FeedSummary> = {}): FeedSummary => ({
  feed_id: 1,
  system_id: 'check',
  feed_url: 'https://api.example.com/gbfs.json?key=•••',
  feed_url_has_hidden_values: true,
  feed_type: 'gbfs',
  data_type: 'vehicles',
  import_strategy: 'clean',
  is_active: true,
  default_vehicle_type: null,
  trip_import_start_date: null,
  remarks: null,
  authentication_type: 'token',
  has_authentication: true,
  request_header_names: ['X-Secret'],
  last_time_updated: '2026-01-01T10:00:00',
  last_time_succesfully_imported: '2026-11-25T10:00:00',
  ignore_disruptions_in_feed_until: null,
  down_since: null,
  ...overrides,
});

const credentials = {
  feed_id: 1,
  feed_url: 'https://api.example.com/gbfs.json?key=secret',
  authentication: { authentication_type: 'token', ApiKeyName: 'X-Key', ApiKey: 'secret-key' },
  request_headers: { 'X-Secret': 'secret-header' },
};

describe('filterFeeds', () => {
  const feeds = [
    feed({ feed_id: 1, system_id: 'check' }),
    feed({ feed_id: 2, system_id: 'dott', data_type: 'trips', feed_type: 'mds-trips-v2' }),
    feed({ feed_id: 3, system_id: 'check', is_active: false }),
  ];
  const noFilters = { operator: null, dataType: null, showInactive: true, search: '' };

  it('filters on operator, data type and active state', () => {
    expect(filterFeeds(feeds, { ...noFilters, operator: 'check' }).map((f) => f.feed_id)).toEqual([1, 3]);
    expect(filterFeeds(feeds, { ...noFilters, dataType: 'trips' }).map((f) => f.feed_id)).toEqual([2]);
    expect(filterFeeds(feeds, { ...noFilters, showInactive: false }).map((f) => f.feed_id)).toEqual([1, 2]);
  });

  it('searches in feed type and id', () => {
    expect(filterFeeds(feeds, { ...noFilters, search: 'MDS-trips' }).map((f) => f.feed_id)).toEqual([2]);
    expect(filterFeeds(feeds, { ...noFilters, search: '3' }).map((f) => f.feed_id)).toEqual([3]);
  });
});

describe('getFeedStatus', () => {
  it('reports inactive, down, never imported and ok feeds', () => {
    expect(getFeedStatus(feed({ is_active: false })).key).toBe('inactive');
    expect(getFeedStatus(feed({ down_since: '2026-11-25T09:00:00' })).key).toBe('down');
    expect(getFeedStatus(feed({ last_time_succesfully_imported: null })).key).toBe('never_imported');
    expect(getFeedStatus(feed()).key).toBe('ok');
  });
});

describe('authentication', () => {
  it('builds the structure the importer reads', () => {
    expect(buildAuthentication('oauth2-bolt', {
      TokenURL: 'https://auth.example.com/token', client_id: 'id', client_secret: 'secret', scope: ''
    })).toEqual({
      authentication_type: 'oauth2-bolt',
      TokenURL: 'https://auth.example.com/token',
      OAuth2Credentials: { client_id: 'id', client_secret: 'secret' },
    });
    expect(buildAuthentication('oauth2-dott', {
      keyId: 'k', organizationId: 'o', privateKey: 'pem', audience: 'a, b'
    })).toEqual({
      authentication_type: 'oauth2-dott',
      OAuth2Credentials: { keyId: 'k', organizationId: 'o', privateKey: 'pem', audience: ['a', 'b'] },
    });
    expect(buildAuthentication('', {})).toBeNull();
  });

  it('reads stored authentication back into form values', () => {
    const stored = {
      authentication_type: 'oauth2-dott',
      OAuth2Credentials: { keyId: 'k', organizationId: 'o', privateKey: 'pem', audience: ['a', 'b'] },
    };
    expect(authenticationToValues(stored)).toEqual({
      keyId: 'k', organizationId: 'o', privateKey: 'pem', audience: 'a, b'
    });
  });
});

describe('validateFormValues', () => {
  it('accepts a complete new feed', () => {
    const values = { ...emptyFormValues(), system_id: 'check', feed_url: 'https://example.com/gbfs.json' };
    expect(validateFormValues(values, true)).toEqual({});
  });

  it('reports invalid input', () => {
    const values = {
      ...emptyFormValues(),
      system_id: 'Check',
      feed_type: 'mds-trips-v2',
      feed_url: 'https://example.com/gbfs.json?key=•••',
      authentication_type: 'token',
      authentication_values: { ApiKeyName: 'X-Key' },
      request_headers: [{ name: 'Bad Header', value: 'x' }],
    };
    expect(Object.keys(validateFormValues(values, true)).sort()).toEqual(
      ['authentication', 'feed_type', 'feed_url', 'request_headers', 'system_id']
    );
  });

  it('does not check unreplaced credentials when editing', () => {
    expect(validateFormValues(formValuesFromFeed(feed()), false)).toEqual({});
  });
});

describe('buildUpdatePayload', () => {
  it('is empty when nothing changed', () => {
    expect(buildUpdatePayload(feed(), formValuesFromFeed(feed()))).toEqual({ feed_id: 1 });
  });

  it('ignores loaded credentials that were not edited', () => {
    const values = applyCredentials(formValuesFromFeed(feed()), credentials);
    expect(values.replace_authentication).toBe(true);
    expect(buildUpdatePayload(feed(), values, credentials)).toEqual({ feed_id: 1 });
  });

  it('includes changed fields only', () => {
    const values = {
      ...applyCredentials(formValuesFromFeed(feed()), credentials, ['authentication']),
      authentication_type: '',
      feed_type: 'full_gbfs',
      remarks: 'Nieuwe URL per januari',
    };
    expect(buildUpdatePayload(feed(), values, credentials)).toEqual({
      feed_id: 1,
      feed_type: 'full_gbfs',
      remarks: 'Nieuwe URL per januari',
      authentication: null,
    });
  });
});

describe('buildValidateRequest', () => {
  it('leaves unreplaced credentials to the stored feed', () => {
    expect(buildValidateRequest(formValuesFromFeed(feed()), feed())).toEqual({
      feed_id: 1, system_id: 'check', data_type: 'vehicles', feed_type: 'gbfs'
    });
  });

  it('sends everything for a new feed', () => {
    const values = { ...emptyFormValues(), system_id: 'check', feed_url: 'https://example.com/gbfs.json' };
    expect(buildValidateRequest(values, null)).toEqual({
      system_id: 'check',
      data_type: 'vehicles',
      feed_type: 'gbfs',
      feed_url: 'https://example.com/gbfs.json',
      authentication: null,
      request_headers: null,
    });
  });
});

describe('describeChanges', () => {
  it('never shows credential values', () => {
    const changes = describeChanges(feed(), {
      feed_id: 1,
      feed_url: 'https://user:pw@api.example.com/v2?token=abc',
      authentication: credentials.authentication,
      request_headers: credentials.request_headers,
    });
    const text = JSON.stringify(changes);
    expect(text).not.toContain('secret');
    expect(text).not.toContain('abc');
    expect(text).not.toContain('pw');
  });
});

describe('isRiskyChange', () => {
  it('flags import-affecting changes on active feeds', () => {
    expect(isRiskyChange(feed(), { feed_id: 1, feed_type: 'full_gbfs' })).toBe(true);
    expect(isRiskyChange(feed(), { feed_id: 1, is_active: false })).toBe(true);
    expect(isRiskyChange(feed(), { feed_id: 1, remarks: 'x' })).toBe(false);
    expect(isRiskyChange(feed({ is_active: false }), { feed_id: 1, feed_type: 'full_gbfs' })).toBe(false);
  });
});

describe('maskUrl', () => {
  it('masks user info and query values except paging parameters', () => {
    expect(maskUrl('https://user:pw@example.com/v?key=abc&size=10')).toBe('https://•••@example.com/v?key=•••&size=10');
    expect(maskUrl('https://example.com/gbfs.json')).toBe('https://example.com/gbfs.json');
  });
});

describe('buildCreatePayload', () => {
  it('drops the trip start date for non-trip feeds', () => {
    const values = {
      ...emptyFormValues(),
      system_id: 'check',
      feed_url: 'https://example.com/gbfs.json',
      trip_import_start_date: '2026-01-01',
    };
    expect(buildCreatePayload(values).trip_import_start_date).toBeNull();
  });
});
