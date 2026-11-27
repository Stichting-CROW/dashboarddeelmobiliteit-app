import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import FeedManagement from './FeedManagement';
import { CREDENTIALS_REVEAL_DURATION_MS } from './FeedCredentials';
import { getFeedCredentials, getFeeds, getFeedVehicleTypes } from '../../api/feeds';
import { fetchOperators, getCachedOperators } from '../../api/operators';

const SECRET = 'super-secret-value';

jest.mock('../../api/feeds', () => ({
  getFeeds: jest.fn(),
  getFeedVehicleTypes: jest.fn(),
  getFeedCredentials: jest.fn(),
  createFeed: jest.fn(),
  updateFeed: jest.fn(),
  validateFeed: jest.fn(),
}));

jest.mock('../../api/operators', () => ({
  fetchOperators: jest.fn(),
  getCachedOperators: jest.fn(),
}));

// The real Modal imports a Radix package whose subpath exports Jest cannot resolve.
jest.mock('../Modal/Modal.jsx', () => ({
  __esModule: true,
  default: ({ isVisible, title, children }: any) => (
    isVisible ? <div role="dialog" aria-label={title}>{children}</div> : null
  ),
}));

const store = createStore(combineReducers({
  authentication: (state = { user_data: { token: 'token' } }) => state,
}));

beforeEach(() => {
  (getFeeds as jest.Mock).mockResolvedValue([{
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
  }]);
  (getFeedVehicleTypes as jest.Mock).mockResolvedValue([]);
  (getFeedCredentials as jest.Mock).mockResolvedValue({
    feed_id: 1,
    feed_url: `https://api.example.com/gbfs.json?key=${SECRET}`,
    authentication: { authentication_type: 'token', ApiKeyName: 'X-Key', ApiKey: SECRET },
    request_headers: { 'X-Secret': SECRET },
  });
  (fetchOperators as jest.Mock).mockResolvedValue([{ system_id: 'check', name: 'Check', color: '#000' }]);
  (getCachedOperators as jest.Mock).mockReturnValue(null);
});

afterEach(() => {
  jest.useRealTimers();
});

const renderAt = async (path: string) => {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/feeds" element={<FeedManagement acl={{ is_admin: true }} />} />
          <Route path="/admin/feeds/new" element={<FeedManagement acl={{ is_admin: true }} />} />
          <Route path="/admin/feeds/:feedId" element={<FeedManagement acl={{ is_admin: true }} />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  await screen.findAllByText(/Check \(check\)/);
};

const pageText = () => document.body.innerHTML;

describe('FeedManagement', () => {
  it('lists feeds without credentials', async () => {
    await renderAt('/admin/feeds');
    expect(screen.getByText('https://api.example.com/gbfs.json?key=•••')).toBeInTheDocument();
    expect(pageText()).not.toContain(SECRET);
    expect(getFeedCredentials).not.toHaveBeenCalled();
  });

  it('only shows credentials on request and hides them again', async () => {
    await renderAt('/admin/feeds/1');
    expect(pageText()).not.toContain(SECRET);
    expect(getFeedCredentials).not.toHaveBeenCalled();

    jest.useFakeTimers();
    fireEvent.click(screen.getByText('Toon credentials'));
    await screen.findByText(/Credentials zichtbaar/);
    expect(pageText()).toContain(SECRET);

    act(() => {
      jest.advanceTimersByTime(CREDENTIALS_REVEAL_DURATION_MS + 500);
    });
    expect(pageText()).not.toContain(SECRET);
  });

  it('keeps secrets masked in the edit form', async () => {
    await renderAt('/admin/feeds/1');
    fireEvent.click(screen.getByText('Bewerken'));
    expect(getFeedCredentials).not.toHaveBeenCalled();
    expect(pageText()).not.toContain(SECRET);

    fireEvent.click(screen.getByText('Wijzig authenticatie'));
    const apiKeyInput = await screen.findByLabelText('API key') as HTMLInputElement;
    expect(apiKeyInput.type).toBe('password');
    expect(screen.getByLabelText('Header naam')).toHaveValue('X-Key');
  });
});
