import { ReactNode, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';

import DemoMap from './DemoMap';
import DemoWidgetCard from './DemoWidgetCard';
import { addDemoVehicleImages, demoVehicleIconLayout } from './demoMarkers';
import {
  durationBins,
  getDemoVehiclesGeoJson,
  getDemoDefectVehiclesGeoJson
} from './demoData';

interface DemoVehiclesMapProps {
  title: string;
  description: string;
  /** Show only the non-operational vehicles, like the "Defecte voertuigen" filter. */
  defectOnly?: boolean;
  zoom?: number;
  footer?: ReactNode;
}

export function DurationLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {durationBins.map((item) => (
        <div key={item.bin} className="flex items-center text-xs text-gray-600">
          <span
            className="mr-1 inline-block rounded-full"
            style={{ width: 10, height: 10, backgroundColor: item.color }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}

/**
 * Demo version of the Aanbod map: vehicle markers colored by how long the
 * vehicle has been standing in public space. Uses the same marker sprites and
 * icon-image expression as the production map.
 */
function DemoVehiclesMap({
  title,
  description,
  defectOnly = false,
  zoom = 14,
  footer
}: DemoVehiclesMapProps) {
  const geojson = useMemo(
    () => (defectOnly ? getDemoDefectVehiclesGeoJson() : getDemoVehiclesGeoJson()),
    [defectOnly]
  );

  const onMapLoad = useCallback(
    (map: maplibregl.Map) => {
      map.addSource('demo-vehicles', { type: 'geojson', data: geojson });

      addDemoVehicleImages(map).then((didAddImages) => {
        if (!didAddImages) return;

        try {
          if (!map.getSource('demo-vehicles') || map.getLayer('demo-vehicles-point')) return;

          map.addLayer({
            id: 'demo-vehicles-point',
            type: 'symbol',
            source: 'demo-vehicles',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layout: demoVehicleIconLayout as any
          });
        } catch (error) {
          console.warn('Could not add the demo vehicles layer', error);
          return;
        }

        const popup = new maplibregl.Popup({ closeButton: false, offset: 12 });

        map.on('click', 'demo-vehicles-point', (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const props = feature.properties || {};
          const isDefect = props.is_non_operational === true || props.is_non_operational === 'true';

          popup
            .setLngLat(event.lngLat)
            .setHTML(`
              <div style="font-size: 12px; line-height: 1.5">
                <strong>${props.operator_name}</strong><br />
                Staat hier: ${props.duration_label}
                ${isDefect ? '<br />Status: defect' : ''}
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', 'demo-vehicles-point', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'demo-vehicles-point', () => {
          map.getCanvas().style.cursor = '';
        });
      });
    },
    [geojson]
  );

  return (
    <DemoWidgetCard
      title={title}
      description={description}
      footer={footer !== undefined ? footer : <DurationLegend />}
    >
      <DemoMap onMapLoad={onMapLoad} zoom={zoom} />
    </DemoWidgetCard>
  );
}

export default DemoVehiclesMap;
