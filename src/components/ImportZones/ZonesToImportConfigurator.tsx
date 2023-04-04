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

const ZoneToImport = ({
  data
}) => {
  return <React.Fragment>
    <div>
      <input
        type="checkbox"
        name={`import_zone_${data.zone.geography_id}`}
        defaultChecked={data.is_within_borders_municipality ? true : false}
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
    <div className="w-full grid grid-cols-3 gap-3">

      <div className="font-bold">
        
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

