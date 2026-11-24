import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { AlertTriangle, Check, Loader2, MousePointerClick } from 'lucide-react';

import { StateType } from '../../../types/StateType';
import { getSelectedHbCells } from '../../Map/MapUtils/map.hb';
import { CenterTop } from '../widget-positions/CenterTop';

import './HbStatusWidget.css';

type HbStatus = 'idle' | 'loading' | 'success' | 'error';

interface HbResult {
  total_trips: number;
  cells_with_trips: number;
  cell_count: number;
  viewport_based: boolean;
  selected_count: number;
  duration_ms: number;
}

interface HbError {
  message: string;
  http_status?: number;
}

// After this many ms of loading, show the elapsed time + explanation
const SHOW_ELAPSED_AFTER_MS = 2500;

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('nl-NL').format(value || 0);
};

const formatSeconds = (ms: number): string => {
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
};

const getSelectionLabel = (count: number, h3niveau: any): string => {
  const noun = h3niveau === 'wijk'
    ? (count === 1 ? 'wijk' : 'wijken')
    : (count === 1 ? 'vlak' : 'vlakken');
  return `${count} ${count === 1 ? 'geselecteerd' : 'geselecteerde'} ${noun}`;
};

/**
 * Status widget for the HB-matrix map: shows that data is loading after a
 * click on the map, summarizes the result, and explains what to do when
 * nothing is selected or something went wrong.
 */
const HbStatusWidget = () => {
  const dispatch = useDispatch();

  const status: HbStatus = useSelector((state: StateType) => {
    return state.rentals ? (state.rentals.hb_status || 'idle') : 'idle';
  });
  const loadingSince: number | null = useSelector((state: StateType) => {
    return state.rentals ? state.rentals.hb_loading_since : null;
  });
  const result: HbResult | null = useSelector((state: StateType) => {
    return state.rentals ? state.rentals.hb_result : null;
  });
  const error: HbError | null = useSelector((state: StateType) => {
    return state.rentals ? state.rentals.hb_error : null;
  });
  const filter = useSelector((state: StateType) => state.filter || {});
  const isFilterbarOpen = useSelector((state: StateType) => {
    return (state.ui && state.ui.FILTERBAR) || false;
  });

  // Tick while loading, so the elapsed time can be shown
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    if (status !== 'loading') return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [status, loadingSince]);

  const selectedCells = getSelectedHbCells(filter);
  const isBestemming = filter.herkomstbestemming === 'bestemming';
  const periodDays = Math.max(
    1,
    moment(filter.ontwikkelingtot).diff(moment(filter.ontwikkelingvan), 'days') + 1
  );

  const retry = () => {
    dispatch({ type: 'HB_RETRY' });
  };

  let content: JSX.Element | null = null;

  if (status === 'loading') {
    const elapsedMs = loadingSince ? Math.max(0, now - loadingSince) : 0;
    const showElapsed = elapsedMs >= SHOW_ELAPSED_AFTER_MS;

    content = (
      <div className="hb-status hb-status--loading" role="status" aria-live="polite">
        <Loader2 className="hb-status__icon animate-spin" aria-hidden="true" />
        <div className="hb-status__text">
          <div className="hb-status__title">
            HB-relaties laden…
          </div>
          <div className="hb-status__subtitle">
            {selectedCells.length > 0
              ? `${isBestemming ? 'Bestemmingen vanuit' : 'Herkomst naar'} ${getSelectionLabel(selectedCells.length, filter.h3niveau)}`
              : 'Alle verhuringen in het gebied'}
            {' · '}
            periode van {periodDays} {periodDays === 1 ? 'dag' : 'dagen'}
            {showElapsed && (
              <>
                {' · '}
                <span className="hb-status__elapsed">
                  {formatSeconds(elapsedMs)} bezig
                </span>
                {periodDays > 31 && ' — een lange periode duurt langer'}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  else if (status === 'error') {
    const isAuthError = error && (error.http_status === 401 || error.http_status === 403);

    content = (
      <div className="hb-status hb-status--error" role="alert">
        <AlertTriangle className="hb-status__icon" aria-hidden="true" />
        <div className="hb-status__text">
          <div className="hb-status__title">
            {isAuthError
              ? 'Log in om HB-relaties te bekijken'
              : 'Laden van HB-relaties mislukt'}
          </div>
          {!isAuthError && (
            <div className="hb-status__subtitle">
              {error && error.message ? `${error.message}. ` : ''}
              <button type="button" className="hb-status__button" onClick={retry}>
                Opnieuw proberen
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  else if (status === 'success' && result) {
    if (result.cell_count === 0) {
      content = (
        <div className="hb-status hb-status--info" role="status">
          <MousePointerClick className="hb-status__icon" aria-hidden="true" />
          <div className="hb-status__text">
            <div className="hb-status__title">
              {filter.h3niveau === 'wijk' ? 'Geen wijken beschikbaar' : 'Geen vlakken in beeld'}
            </div>
            <div className="hb-status__subtitle">
              {result.viewport_based
                ? 'Zoom verder in om het raster te zien.'
                : 'Voor dit gebied zijn geen HB-relaties beschikbaar.'}
            </div>
          </div>
        </div>
      );
    }
    else if (result.selected_count === 0) {
      content = (
        <div className="hb-status hb-status--info" role="status">
          <MousePointerClick className="hb-status__icon" aria-hidden="true" />
          <div className="hb-status__text">
            <div className="hb-status__title">
              Klik op een vlak op de kaart
            </div>
            <div className="hb-status__subtitle">
              {isBestemming
                ? 'Je ziet dan waar verhuringen vanuit dat vlak naartoe gingen.'
                : 'Je ziet dan waar verhuringen naar dat vlak vandaan kwamen.'}
              {' '}
              Ctrl+klik om meerdere vlakken te selecteren.
            </div>
          </div>
        </div>
      );
    }
    else {
      content = (
        <div className="hb-status hb-status--success" role="status" aria-live="polite">
          <Check className="hb-status__icon" aria-hidden="true" />
          <div className="hb-status__text">
            <div className="hb-status__title">
              {formatNumber(result.total_trips)}
              {' '}
              {result.total_trips === 1 ? 'verhuring' : 'verhuringen'}
              {' '}
              {isBestemming ? 'vanuit' : 'naar'}
              {' '}
              {getSelectionLabel(result.selected_count, filter.h3niveau)}
            </div>
            <div className="hb-status__subtitle">
              {result.total_trips === 0 && (
                <>Geen verhuringen gevonden voor deze selectie en filters · </>
              )}
              Ctrl+klik voegt vlakken toe
            </div>
          </div>
        </div>
      );
    }
  }

  if (!content) return null;

  return (
    <div className={isFilterbarOpen ? 'filter-open' : ''}>
      <CenterTop>
        {content}
      </CenterTop>
    </div>
  );
};

export default HbStatusWidget;
