import { useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';

import DemoMap from './DemoMap';
import DemoWidgetCard from './DemoWidgetCard';
import { getDemoVehiclesGeoJson } from './demoData';
import heatmapLayer from '../../Map/layers/vehicles-heatmap.js';

const heatmapColors = ['#ffd837', '#fe862e', '#fd3e48', '#9a231f'];

/** Demo version of the heatmap view of the Aanbod map. */
function DemoHeatmapMap() {
  const geojson = useMemo(() => {
    const data = getDemoVehiclesGeoJson();
    // The production heatmap weighs points by 'mag'; give every demo vehicle
    // the same weight so the heat purely reflects vehicle density.
    return {
      ...data,
      features: data.features.map((feature) => ({
        ...feature,
        properties: { ...feature.properties, mag: 10 }
      }))
    };
  }, []);

  const onMapLoad = useCallback(
    (map: maplibregl.Map) => {
      map.addSource('demo-vehicles', { type: 'geojson', data: geojson as never });

      map.addLayer({
        ...heatmapLayer,
        id: 'demo-vehicles-heatmap',
        source: 'demo-vehicles',
        paint: {
          ...heatmapLayer.paint,
          // The production intensity is tuned for thousands of vehicles in a
          // city; this demo only holds a neighbourhood worth of them.
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.6,
            13, 1.4,
            16, 2
          ]
        }
      } as unknown as maplibregl.HeatmapLayerSpecification);
    },
    [geojson]
  );

  return (
    <DemoWidgetCard
      title="Voertuigweergave en heatmap"
      description="Dezelfde voertuigen als hiernaast, maar als heatmap: waar staan de meeste voertuigen?"
      footer={
        <div className="flex items-center text-xs text-gray-600">
          <span className="mr-2">Minder</span>
          <span
            className="inline-block rounded"
            style={{
              width: 90,
              height: 10,
              background: `linear-gradient(to right, ${heatmapColors.join(', ')})`
            }}
          />
          <span className="ml-2">meer voertuigen</span>
        </div>
      }
    >
      <DemoMap onMapLoad={onMapLoad} zoom={13.6} fitTo={geojson} maxFitZoom={14} />
    </DemoWidgetCard>
  );
}

export default DemoHeatmapMap;
