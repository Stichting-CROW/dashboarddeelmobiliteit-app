import Modal from '../Modal/Modal.jsx';
import React, {
  useEffect,
  useState,
  useCallback
} from 'react';
import {
  useSelector
} from 'react-redux';
import {StateType} from '../../types/StateType';

import Button from '../Button/Button';

const getAllCheckboxes = () => {
  const checkboxes = (document.querySelectorAll('input[type=checkbox]') as NodeListOf<Element>);
  const relevantCheckboxes = [];
  checkboxes.forEach(x => {
    // Get input name
    const name = x['name'];
    // Check if this is a checkbox we want to check
    if(name.indexOf('import_zone_') <= -1) return;
    
    relevantCheckboxes.push(x);
  });
  return relevantCheckboxes;
}

const selectAll = () => {
  const checkboxes = getAllCheckboxes();
  checkboxes.forEach(x => {
    if(x.disabled) return;
    x.checked = true;
  });
}

const deselectAll = () => {
  const checkboxes = getAllCheckboxes();
  checkboxes.forEach(x => {
    x.checked = false;
  });
}

const ZoneToImport = ({
  data
}) => {
  return <React.Fragment>
    <div>
      <input
        type="checkbox"
        name={`import_zone_${data.zone.geography_id}`}
        defaultChecked={data.is_within_borders_municipality ? true : false}
        disabled={! data.is_within_borders_municipality ? true : false}
      />
    </div>
    <div>
      {data.zone.name}
    </div>
    <div className="text-red-500">
      {data.is_within_borders_municipality ? '' : 'ongeldige zone'}
    </div>
  </React.Fragment>
}

const ZonesToImportConfigurator = ({
  draftZones
}: {
  draftZones: any
}) => {
  return <>
    <div className="w-full grid grid-cols-3 gap-3" style={{
      gridTemplateColumns: '1fr auto 1fr'
    }}>

      <div className="font-bold">
        Selecteer <a href="#" className="underline" onClick={selectAll}>
          alles
        </a> / <a href="#" className="underline" onClick={deselectAll}>
          niets
        </a>
      </div>
      <div className="font-bold">
        Naam
      </div>
      <div className="font-bold">
      </div>
      {draftZones.map(x => {
        return <ZoneToImport key={x.zone.geography_id} data={x} />
      })}
    </div>

  </>
};

export {
  ZonesToImportConfigurator
};

