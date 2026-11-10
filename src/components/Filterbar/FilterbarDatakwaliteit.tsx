import React from 'react';
import './css/FilterbarPermits.css';
import './css/FilteritemGebieden.css';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { addDays } from 'date-fns';
import LogoDashboardDeelmobiliteit from '../Logo/LogoDashboardDeelmobiliteit';
import Fieldset from '../Fieldset/Fieldset';
import FilterbarStatistiek from './FilterbarStatistiek';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatumVanTot from './FilteritemDatumVanTot';
import { StateType } from '../../types/StateType';
import { isOperatorPrestatiesView } from '../../helpers/prestatiesAanbiedersViewMode';

interface FilterbarDatakwaliteitProps {
  hideLogo: boolean;
}

function FilterbarDatakwaliteit({ hideLogo }: FilterbarDatakwaliteitProps) {
  const gebiedenCount = useSelector((state: StateType) =>
    state.metadata?.gebieden ? state.metadata.gebieden.length : 0
  );
  const isOperatorAccount = useSelector((state: StateType) =>
    isOperatorPrestatiesView(state.metadata?.aclOperators || [])
  );

  const today = new Date(new Date().toDateString());

  return (
    <div className="filter-bar-inner">
      <div style={{ paddingBottom: '48px' }}>
        {!hideLogo && <Link to="/"><LogoDashboardDeelmobiliteit /></Link>}
      </div>

      <FilterbarStatistiek />

      <Fieldset title="Periode">
        <FilteritemDatumVanTot
          presetButtons={[
            { key: 'fdvt-dq1', view: 'vandaag', label: 'Vandaag' },
            { key: 'fdvt-dq2', view: 'laatste7dagen', label: 'Laatste 7 dagen' },
            { key: 'fdvt-dq3', view: 'laatste30dagen', label: 'Laatste 30 dagen' },
            { key: 'fdvt-dq4', view: 'laatste90dagen', label: 'Laatste 90 dagen' },
          ]}
          defaultPresetView="laatste7dagen"
          defaultStartDate={addDays(today, -6)}
          defaultEndDate={today}
          showPresetOptionsByDefault={true}
        />
      </Fieldset>

      {!isOperatorAccount && gebiedenCount > 1 && (
        <Fieldset title="Plaats">
          <FilteritemGebieden />
        </Fieldset>
      )}
    </div>
  );
}

export default FilterbarDatakwaliteit;
