import React from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';

import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addDays } from 'date-fns';

import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';
import Fieldset from '../Fieldset/Fieldset';
import FilterbarStatistiek from './FilterbarStatistiek';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatumVanTot from './FilteritemDatumVanTot';

import { StateType } from '../../types/StateType';

interface FilterbarBeleidszonesProps {
  hideLogo: boolean;
}

function FilterbarBeleidszones({ hideLogo }: FilterbarBeleidszonesProps) {
  const gebieden = useSelector((state: StateType) => {
    return (state.metadata && state.metadata.gebieden) ? state.metadata.gebieden : [];
  });

  const hidePlaats = gebieden.length <= 1;

  return (
    <div className="filter-bar-inner">
      <div style={{ paddingBottom: '48px' }}>
        {!hideLogo && (
          <Link to="/">
            <LogoDashboardDeelmobiliteit />
          </Link>
        )}
      </div>

      <FilterbarStatistiek />

      <Fieldset title="Periode">
        <FilteritemDatumVanTot
          presetButtons={[
            { key: 'fdvt-po1', view: 'laatste7dagen_yesterday', label: 'Laatste 7 dagen' },
            { key: 'fdvt-po2', view: 'laatste14dagen_yesterday', label: 'Laatste 14 dagen' },
            { key: 'fdvt-po3', view: 'laatste30dagen_yesterday', label: 'Laatste 30 dagen' },
            { key: 'fdvt-po4', view: 'laatste90dagen_yesterday', label: 'Laatste 90 dagen' },
          ]}
          defaultStartDate={new Date(addDays(new Date(), -7).toDateString())}
          defaultEndDate={new Date(addDays(new Date(), -1).toDateString())}
        />
      </Fieldset>

      {!hidePlaats && (
        <Fieldset title="Plaats">
          <FilteritemGebieden />
        </Fieldset>
      )}
    </div>
  );
}

export default FilterbarBeleidszones;
