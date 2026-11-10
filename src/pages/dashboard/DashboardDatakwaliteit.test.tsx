import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import moment from 'moment';
import DashboardDatakwaliteit from './DashboardDatakwaliteit';

// CRA's Jest can't resolve package.json "exports" subpaths used by Radix UI.
jest.mock(
  '@radix-ui/primitive/is-development',
  () => ({ IS_DEVELOPMENT: false }),
  { virtual: true }
);

const buildState = (isAdmin: boolean) => ({
  authentication: {
    user_data: { acl: { is_admin: isAdmin }, user: { email: 'admin@example.com' } },
  },
  filter: { gebied: '' },
  metadata: {
    aanbieders: [
      { system_id: 'lime', name: 'Lime' },
      { system_id: 'dott', name: 'Dott' },
      { system_id: 'check', name: 'CHECK' },
    ],
    aclOperators: [],
    gebieden: [{ gm_code: 'GM0599', name: 'Rotterdam' }],
    vehicle_types: [{ id: 'bicycle', name: 'Fiets' }],
  },
});

const renderPage = (isAdmin = true) => {
  const store = createStore(() => buildState(isAdmin));
  const end = moment().format('YYYY-MM-DD');
  const start = moment().subtract(6, 'days').format('YYYY-MM-DD');
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/stats/datakwaliteit?start_date=${start}&end_date=${end}`]}>
        <DashboardDatakwaliteit />
      </MemoryRouter>
    </Provider>
  );
};

const getCards = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.data-quality-card')) as HTMLElement[];

describe('DashboardDatakwaliteit in demo mode', () => {
  const originalDemoMode = process.env.REACT_APP_DEMO_MODE;

  beforeEach(() => {
    process.env.REACT_APP_DEMO_MODE = 'true';
    localStorage.clear();
  });

  afterAll(() => {
    process.env.REACT_APP_DEMO_MODE = originalDemoMode;
  });

  it('renders one card per operator with all indicators', async () => {
    const { container } = renderPage();

    await waitFor(() => expect(getCards(container)).toHaveLength(3));
    expect(screen.getByText(/Demomodus/)).toBeInTheDocument();

    const card = getCards(container)[0];
    expect(within(card).getByText('Handmatig afgekeurd')).toBeInTheDocument();
    expect(within(card).getByText('Aanbod feed beschikbaar')).toBeInTheDocument();
    expect(within(card).getByText('Verhuringen feed beschikbaar')).toBeInTheDocument();
    expect(within(card).getByText('Servicegebieden feed beschikbaar')).toBeInTheDocument();
  });

  it('shows the all-operator rejection on every card', async () => {
    const { container } = renderPage();

    await waitFor(() => expect(getCards(container)).toHaveLength(3));
    getCards(container).forEach((card) => {
      expect(within(card).getAllByText(/Storing in de importer/).length).toBeGreaterThan(0);
    });
  });

  it('lets admins add a rejection and validates the form', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(getCards(container)).toHaveLength(3));
    const before = container.querySelectorAll('.data-quality-rejection').length;

    const [headerAddButton] = screen.getAllByRole('button', { name: /Afkeuring toevoegen/ });
    fireEvent.click(headerAddButton);
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(within(dialog).getByText('Aanbod'));
    fireEvent.click(within(dialog).getByText('Opslaan'));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Kies minimaal één datatype.');
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Kies minimaal één aanbieder.');

    fireEvent.click(within(dialog).getByText('Aanbod'));
    fireEvent.click(within(dialog).getByText('Alle aanbieders'));
    fireEvent.change(within(dialog).getByLabelText('Notitie'), {
      target: { value: 'Nieuwe testafkeuring' },
    });
    fireEvent.click(within(dialog).getByText('Opslaan'));

    await waitFor(() =>
      expect(container.querySelectorAll('.data-quality-rejection').length).toBe(before + 3)
    );
    expect(screen.getAllByText('Nieuwe testafkeuring')).toHaveLength(3);
    expect(screen.getAllByText(/Aangemaakt door admin@example.com/).length).toBeGreaterThan(0);
  });

  it('hides edit controls for non-admins', async () => {
    const { container } = renderPage(false);

    await waitFor(() => expect(getCards(container)).toHaveLength(3));
    expect(screen.queryByRole('button', { name: /Afkeuring toevoegen/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Afkeuring verwijderen/ })).not.toBeInTheDocument();
  });
});
