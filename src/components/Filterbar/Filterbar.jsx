import './css/Filterbar.css';
import { Link } from "react-router-dom";
import {useSelector} from 'react-redux';
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
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes.jsx';
import Logo from '../Logo.jsx';
import Fieldset from '../Fieldset/Fieldset';

import {StateType} from '../../types/StateType';

import FilterbarServiceAreas from './FilterbarServiceAreas';
import FilterbarZones from './FilterbarZones';
import FilterbarRentals from './FilterbarRentals';
import FilterbarHb from './FilterbarHb';
import FilterbarPolicyHubs from './FilterbarPolicyHubs';

// Import API functions
import {postZone} from '../../api/zones';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_SERVICE_AREAS,
  DISPLAYMODE_POLICY_HUBS,
  DISPLAYMODE_OTHER
} from '../../reducers/layers.js';

function Filterbar({
  displayMode,
  visible,
  hideLogo
}) {

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

  const ispark=displayMode===DISPLAYMODE_PARK;
  const isrentals=displayMode===DISPLAYMODE_RENTALS;
  const iszonesadmin=displayMode===DISPLAYMODE_ZONES_ADMIN;
  const iszonespublic=displayMode===DISPLAYMODE_ZONES_PUBLIC;
  const isservicegebieden=displayMode===DISPLAYMODE_SERVICE_AREAS;
  const isPolicyHubs=displayMode===DISPLAYMODE_POLICY_HUBS;
  const isontwikkeling=displayMode===DISPLAYMODE_OTHER;

  const showdatum=isrentals||ispark||!isLoggedIn;
  const showduur=isrentals;
  const showparkeerduur=ispark;
  const showafstand=isrentals;
  const showherkomstbestemming=isrentals;
  const showvantot=isontwikkeling;
  const showvervoerstype=isrentals||ispark||!isLoggedIn;
  const is_hb_view=(isrentals && viewRentals==='verhuurdata-hb');

  const filterGebied = useSelector((state: StateType) => {
    return state.filter ? state.filter.gebied : null
  });

  // Show custom zones if >= 2022-11
  // We have detailled aggregated stats from 2022-11
  const doShowCustomZones =
    moment(filter.ontwikkelingvan).unix() >= moment('2022-11-01 00:00').unix();

  let zonesToShow;
  if(isontwikkeling) {
    zonesToShow = [
      'residential_area',
    ];
    if(doShowCustomZones) {
      zonesToShow.push('custom')
    }
  } else {
    zonesToShow = [
      'residential_area',
      'custom',
      'neighborhood'
    ];
  }

  return <>

    {/* Zones */
    (iszonespublic || iszonesadmin) && 
      <FilterbarZones
        view={iszonespublic ? 'readonly' : 'adminView'}
        hideLogo={hideLogo}
      />
    }

    {/* Servicegebieden */
    (isservicegebieden) &&
      <FilterbarServiceAreas
        hideLogo={hideLogo}
      />
    }

    {/* Beleidshubs */
    (isPolicyHubs) &&
      <FilterbarPolicyHubs
        hideLogo={hideLogo}
      />
    }

    {/* HB */
    (is_hb_view) &&
      <FilterbarHb
        hideLogo={hideLogo}
        displayMode={displayMode}
        visible={visible}
      />
    }

    {/* Verhuringen */
    (isrentals) &&
      <FilterbarRentals
        hideLogo={hideLogo}
        displayMode={displayMode}
        visible={visible}
      />
    }

    {/* Default: */
    (! (iszonespublic || iszonesadmin)
      && ! isservicegebieden
      && ! isPolicyHubs
      && ! is_hb_view
      && ! isrentals
    ) &&
      <div className="filter-bar-inner py-2">

        <div className="justify-between hidden sm:flex" style={{
          paddingBottom: '24px'
        }}>
          <div style={{minWidth: '82px'}}>
            {! hideLogo && (
              ispark
                ? <Logo />
                : <Link to="/"><Logo /></Link>
            )}
          </div>
          <div className="ml-4 text-sm flex justify-center flex-col" style={{
            color: '#FD862E'
          }}>
            {/* INFO */}
          </div>
        </div>

        { isLoggedIn && showdatum && <FilteritemDatum /> }
        
        { ! isLoggedIn && showdatum && <div>
          <div className="filter-datum-container">
            <div className="filter-datum-title">
              Tijd
            </div>
            <div className="filter-datum-box-row">
              {moment(filterDatum).format('HH:mm')}
            </div>
          </div>
        </div> }

        { isLoggedIn && showduur && <FilteritemDuur /> }

        {showvantot && <Fieldset title="Periode">
          <FilteritemDatumVanTot />
        </Fieldset>}

        <Fieldset title="Plaats">
          <FilteritemGebieden />
        </Fieldset>

        {filterGebied && <Fieldset title="Zones">
          <FilteritemZones
            zonesToShow={zonesToShow}
          />
        </Fieldset>}

        {isLoggedIn && showparkeerduur && (
          <Fieldset title="Parkeerduur">
            <FilteritemMarkersParkeerduur />
          </Fieldset>
        )}

        {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

        {isLoggedIn && showherkomstbestemming && <FilteritemHerkomstBestemming />}

        {showvervoerstype && (
          <Fieldset title="Voertuigtype">
            <FilteritemVoertuigTypes />
          </Fieldset>
        )}

        {<FilteritemAanbieders />}

      </div>
    }

    {/* Policy hubs has its own release notes */
    ! isPolicyHubs &&
      <div className="absolute top-4 text-xs text-purple-800" style={{left: '110px', fontSize: '0.75rem'}}>
        versie 2024-09-14<br />
        - Nieuwe <Link to="/docs">documentatie</Link><br />
      </div>
}
  </>
}

export default Filterbar;
