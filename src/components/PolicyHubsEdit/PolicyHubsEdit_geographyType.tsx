import { useEffect, useState } from 'react';
import center from '@turf/center';

export const PolicyHubsEdit_geographyType = ({
    defaultStopProperties,
    hubData,
    setHubData,
    setHasUnsavedChanges
}) => {
  const [geoType, setGeoType] = useState(hubData?.geography_type);
  
  useEffect(() => {
    updateGeographyType(geoType);
  }, [geoType]);

  const updateGeographyType = (type: string) => {
    const polygonCenter = (hubData?.area && Object.keys(hubData.area).length > 0) ? center(hubData?.area) : null;

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
            setGeoType(x.name);
          }}
          >
            {x.title}
          </div>
        })}
      </div>
      {geoType === 'no_parking' && <div>
        <p className="mt-2 mb-2 text-sm">
          Geldt voor:
        </p>
      </div>}
    </div>
  )
}