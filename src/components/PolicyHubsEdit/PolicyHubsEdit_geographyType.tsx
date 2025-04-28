import center from '@turf/center';
import { useDispatch, useSelector } from 'react-redux';

import {StateType} from '../../types/StateType';

import VoertuigTypeSelector from '../VoertuigTypesSelector/VoertuigTypesSelector';
import { useEffect, useState } from 'react';

export const PolicyHubsEdit_geographyType = ({
  defaultStopProperties,
  hubData,
  setHubData,
  setHasUnsavedChanges
}) => {
  const voertuigtypes = useSelector((state: StateType) => state.metadata.vehicle_types ? state.metadata.vehicle_types || [] : []);

  const [activeTypes, setActiveTypes] = useState(hubData.affected_modalities || [
    "moped",
    "cargo_bicycle",
    "bicycle"
  ]);

  // Set effected_modalities in state if hubData updates
  useEffect(() => {
    if(! hubData?.affected_modalities) return;

    setActiveTypes(hubData?.affected_modalities);
  }, [hubData?.affected_modalities]);

  // Function that updates geography_type
  const updateGeographyType = (type: string) => {
    const polygonCenter = (hubData?.area && Object.keys(hubData?.area).length) > 0 ? center(hubData?.area) : null;

    setHubData({
      ...hubData,
      geography_type: type,
      description: (type === 'no_parking' ? 'Verbodsgebied' : 'Hub'),
      stop: type === 'stop' ? {
        ...hubData.stop,
        is_virtual: hubData.stop?.is_virtual || defaultStopProperties.is_virtual,
        status: hubData.stop?.status || defaultStopProperties.status,
        capacity: hubData.stop?.capacity || defaultStopProperties.capacity,
        location: polygonCenter
      } : null
    });

    setHasUnsavedChanges(true);
  }
  
  // Function that executes if a type is clicked on
  const clickFilter = (type: string) => {
    const newTypes = activeTypes.includes(type) ? activeTypes.filter(x => x !== type) : [...activeTypes, type]
    setActiveTypes(newTypes);

    setHubData({
      ...hubData,
      affected_modalities: newTypes
    });
  }

  return (
    <div className="
      mt-0
    ">
      <div className="
        flex
        rounded-lg bg-white
        border-solid
        border
        border-gray-400
        text-sm
      ">
        {[
          {name: 'monitoring', title: 'Analyse', color: '#15aeef'},
          {name: 'stop', title: 'Hub', color: '#fd862e'},
          {name: 'no_parking', title: 'Verbodsgebied', color: '#fd3e48'}
        ].map(x => {
          return <div className={`
            ${hubData.geography_type === x.name ? 'Button-orange' : 'text-gray-500'}
            cursor-pointer
            flex-1
            
            rounded-lg
            text-center
            h-10
            flex
            flex-col
            justify-center
          `}
          style={{
            backgroundColor: `${hubData.geography_type === x.name ? x.color : ''}`,
            flex: x.name === 'no_parking' ?  '2' : '1'
          }}
          key={x.name}
          onClick={() => {
            updateGeographyType(x.name);
          }}
          >
            {x.title}
          </div>
        })}
      </div>
      {hubData.geography_type === 'no_parking' && <>
        <div className="mt-2">
          <div className="text-xs text-gray-500">
            Geldig voor:
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <VoertuigTypeSelector
              voertuigtypes={voertuigtypes.filter(x => x.id !== 'unknown')}
              activeTypes={activeTypes}
              onTypeClick={clickFilter}
            />
          </div>
        </div>
      </>}
    </div>
  )
}