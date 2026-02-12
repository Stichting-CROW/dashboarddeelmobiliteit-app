import './css/Filterbar.css';
import './css/FilterbarPermits.css';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemDatumVanTot from './FilteritemDatumVanTot.jsx';
import FilteritemDuur from './FilteritemDuur.jsx';
import FilteritemAanbieders from './FilteritemAanbieders';
import FilteritemZones from './FilteritemZones.jsx';
import {
  FilteritemMarkersAfstand,
  FilteritemMarkersParkeerduur
} from './FilteritemMarkers.jsx';
import FilteritemHerkomstBestemming from './FilteritemHerkomstBestemming';
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes';
import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';
import Fieldset from '../Fieldset/Fieldset';
import { isRentalsLayerActive, selectActiveDataLayers } from '../../helpers/layerSelectors';

import { StateType } from '../../types/StateType';

import FilterbarServiceAreas from './FilterbarServiceAreas';
import FilterbarZones from './FilterbarZones';
import FilterbarRentals from './FilterbarRentals';
import FilterbarHb from './FilterbarHb';
import FilterbarPolicyHubs from './FilterbarPolicyHubs';
import FilterbarPermits from './FilterbarPermits';
import FilterbarStart from './FilterbarStart';
import FilterbarStatistiek from './FilterbarStatistiek';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_SERVICE_AREAS,
  DISPLAYMODE_POLICY_HUBS,
  DISPLAYMODE_START,
  DISPLAYMODE_DASHBOARD,
  DISPLAYMODE_OTHER,
  DISPLAYMODE_VERHUURDATA_HB
} from '../../reducers/layers.js';

export interface FilterbarProps {
  displayMode: string;
  visible?: boolean;
  hideLogo?: boolean;
}

function Filterbar({
  displayMode,
  visible,
  hideLogo
}: FilterbarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const isBeleidsinfo = pathname === '/dashboard/beleidsinfo';

  const activeDataLayers = useSelector(selectActiveDataLayers);

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const filter = useSelector((state: StateType) => {
    return state.filter;
  });

  const filterDatum = useSelector((state: StateType) => {
    return state.filter && state.filter.datum ? state.filter.datum : new Date().toISOString();
  });

  const viewRentals = useSelector((state: StateType) => {
    return state.layers ? state.layers.view_rentals : null;
  });

  const checkRentalsLayerActive = (layerName: string): boolean => {
    return isRentalsLayerActive(activeDataLayers, layerName);
  };

  const ispark = displayMode === DISPLAYMODE_PARK;
  const isrentals = displayMode === DISPLAYMODE_RENTALS;
  const iszonesadmin = displayMode === DISPLAYMODE_ZONES_ADMIN;
  const iszonespublic = displayMode === DISPLAYMODE_ZONES_PUBLIC;
  const isservicegebieden = displayMode === DISPLAYMODE_SERVICE_AREAS;
  const isPolicyHubs = displayMode === DISPLAYMODE_POLICY_HUBS;
  const isStart = displayMode === DISPLAYMODE_START;
  const isPrestatiesAanbieders = displayMode === DISPLAYMODE_DASHBOARD;
  const isontwikkeling = displayMode === DISPLAYMODE_OTHER;

  const showdatum = isrentals || ispark || !isLoggedIn;
  const showduur = isrentals;
  const showparkeerduur = ispark;
  const showafstand = isrentals;
  const showherkomstbestemming = isrentals;
  const showvantot = isontwikkeling;
  const showvervoerstype = isrentals || ispark || !isLoggedIn;
  const is_hb_view = checkRentalsLayerActive(DISPLAYMODE_VERHUURDATA_HB);

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : null;
  });

  // Show custom zones if >= 2022-11
  // We have detailled aggregated stats from 2022-11
  const doShowCustomZones =
    moment(filter?.ontwikkelingvan).unix() >= moment('2022-11-01 00:00').unix();

  let zonesToShow: ('residential_area' | 'custom' | 'neighborhood')[];
  if (isontwikkeling) {
    zonesToShow = ['residential_area'];
    if (doShowCustomZones) {
      zonesToShow.push('custom');
    }
  } else {
    zonesToShow = ['residential_area', 'custom', 'neighborhood'];
  }

  return (
    <>
      {/* Zones */}
      {(iszonespublic || iszonesadmin) && (
        <FilterbarZones
          view={iszonespublic ? 'readonly' : 'adminView'}
          hideLogo={hideLogo}
        />
      )}

      {/* Servicegebieden */}
      {isservicegebieden && (
        <FilterbarServiceAreas hideLogo={hideLogo} />
      )}

      {/* Beleidshubs */}
      {isPolicyHubs && (
        <FilterbarPolicyHubs hideLogo={hideLogo} view="readonly" />
      )}

      {/* HB */}
      {isrentals && is_hb_view && (
        <FilterbarHb
          hideLogo={hideLogo}
          displayMode={displayMode}
          visible={visible}
        />
      )}

      {/* Verhuringen */}
      {isrentals && !is_hb_view && (
        <FilterbarRentals
          hideLogo={hideLogo}
          displayMode={displayMode}
          visible={visible}
        />
      )}

      {isStart && (
        <FilterbarStart hideLogo={hideLogo ?? false} hideDatumTijd={true} />
      )}

      {/* Prestaties aanbieders */}
      {isPrestatiesAanbieders && (
        <FilterbarPermits hideLogo={hideLogo ?? false} hideDatumTijd={true} />
      )}

      {/* Default */}
      {!(
        iszonespublic ||
        iszonesadmin ||
        isservicegebieden ||
        isPolicyHubs ||
        isrentals ||
        isPrestatiesAanbieders ||
        isStart
      ) && (
        <div className="filter-bar-inner">
          <div
            className="justify-between hidden sm:flex"
            style={{ paddingBottom: '48px' }}
          >
            <div style={{ minWidth: '82px' }}>
              {!hideLogo &&
                (ispark ? (
                  <LogoDashboardDeelmobiliteit />
                ) : (
                  <Link to="/">
                    <LogoDashboardDeelmobiliteit />
                  </Link>
                ))}
            </div>
            <div
              className="ml-4 text-sm flex justify-center flex-col"
              style={{ color: '#FD862E' }}
            >
              {/* INFO */}
            </div>
          </div>

          {isBeleidsinfo && <FilterbarStatistiek />}

          {isLoggedIn && showdatum && <FilteritemDatum disabled={false} />}

          {!isLoggedIn && showdatum && (
            <div>
              <div className="filter-datum-container">
                <div className="filter-datum-title">Tijd</div>
                <div className="filter-datum-box-row">
                  {moment(filterDatum).format('HH:mm')}
                </div>
              </div>
            </div>
          )}

          {isLoggedIn && showduur && <FilteritemDuur />}

          {showvantot && (
            <Fieldset title="Periode">
              <FilteritemDatumVanTot
                presetButtons={[
                  { key: 'fdvt-po1', view: 'vandaag', label: 'Vandaag' },
                  { key: 'fdvt-po2', view: 'laatste2dagen', label: 'Laatste 2 dagen' },
                  { key: 'fdvt-po3', view: 'laatste7dagen', label: 'Laatste 7 dagen' },
                  { key: 'fdvt-po4', view: 'laatste30dagen', label: 'Laatste 30 dagen' },
                  { key: 'fdvt-po5', view: 'laatste90dagen', label: 'Laatste 90 dagen' },
                  { key: 'fdvt-po6', view: 'laatste12maanden', label: 'Laatste 12 maanden' },
                  { key: 'fdvt-po7', view: 'ditjaar', label: 'Dit jaar' },
                  { key: 'fdvt-po8', view: 'vorigjaar', label: 'Vorig jaar' },
                ]}
                defaultStartDate={moment().subtract(30, 'days').toDate()}
                defaultEndDate={new Date()}
              />
            </Fieldset>
          )}

          <Fieldset title="Plaats">
            <FilteritemGebieden />
          </Fieldset>

          {filterGebied && (
            <Fieldset title="Zones">
              <FilteritemZones zonesToShow={zonesToShow} />
            </Fieldset>
          )}

          {isLoggedIn && showparkeerduur && (
            <Fieldset title="Parkeerduur">
              <FilteritemMarkersParkeerduur />
            </Fieldset>
          )}

          {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

          {isLoggedIn && showherkomstbestemming && (
            <FilteritemHerkomstBestemming />
          )}

          {showvervoerstype && (
            <Fieldset title="Voertuigtype">
              <FilteritemVoertuigTypes />
            </Fieldset>
          )}

          <FilteritemAanbieders />
        </div>
      )}

      {/* <div
        className="absolute text-xs text-purple-800"
        style={{
          left: '102px',
          fontSize: '0.75rem',
          top: '16px',
          width: '210px'
        }}
      >
        versie{' '}
        <a
          href="https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/blob/main/RELEASES.md#dashboard-deelmobiliteit-app-releases"
          target="_blank"
          rel="external noreferrer"
          className="underline"
        >
          2026-02-11
        </a>
        <br />
      </div> */}
    </>
  );
}

export default Filterbar;
