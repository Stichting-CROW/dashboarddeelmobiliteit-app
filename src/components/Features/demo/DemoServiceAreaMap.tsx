import { useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';

import DemoMap from './DemoMap';
import DemoWidgetCard from './DemoWidgetCard';
import { demoOperators } from './demoData';
import { demoServiceAreaCenter, getDemoServiceAreaGeoJson } from './demoAreas';

const operator = demoOperators[1];

/**
 * Demo version of the Servicegebieden map: the current service area of one
 * operator, filled with the operator color like in the app.
 */
function DemoServiceAreaMap() {
  const geojson = useMemo(() => getDemoServiceAreaGeoJson(operator.name), []);

  const onMapLoad = useCallback(
    (map: maplibregl.Map) => {
      map.addSource('demo-service-area', { type: 'geojson', data: geojson });

      map.addLayer({
        id: 'demo-service-area-fill',
        type: 'fill',
        source: 'demo-service-area',
        paint: {
          'fill-color': operator.color,
          'fill-opacity': 0.6
        }
      });

      map.addLayer({
        id: 'demo-service-area-border',
        type: 'line',
        source: 'demo-service-area',
        paint: {
          'line-color': '#DDD',
          'line-width': 1
        }
      });
    },
    [geojson]
  );

  return (
    <DemoWidgetCard
      title={`Servicegebied van ${operator.name}`}
      description="Binnen dit gebied mag je het voertuig huren en parkeren. Het uitgesneden deel valt buiten het servicegebied."
      footer={
        <div className="flex items-center text-xs text-gray-600">
          <span
            className="mr-2 inline-block rounded"
            style={{ width: 12, height: 12, backgroundColor: operator.color, opacity: 0.6 }}
          />
          {operator.name}, actueel servicegebied
        </div>
      }
    >
      <DemoMap
        onMapLoad={onMapLoad}
        zoom={10.6}
        center={demoServiceAreaCenter}
        fitTo={geojson}
        maxFitZoom={13}
      />
    </DemoWidgetCard>
  );
}

export default DemoServiceAreaMap;
