import { useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';

import DemoMap from './DemoMap';
import DemoWidgetCard from './DemoWidgetCard';
import { addDemoRentalImages, demoRentalIconLayout } from './demoMarkers';
import { distanceBins, getDemoRentalOriginsGeoJson } from './demoData';

function DistanceLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {distanceBins.map((item) => (
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
 * Demo version of the Verhuringen map: every marker is the departure location
 * of a rental, colored by the distance that was travelled.
 */
function DemoRentalOriginsMap() {
  const geojson = useMemo(() => getDemoRentalOriginsGeoJson(), []);

  const onMapLoad = useCallback(
    (map: maplibregl.Map) => {
      map.addSource('demo-rentals', { type: 'geojson', data: geojson });

      addDemoRentalImages(map).then((didAddImages) => {
        if (!didAddImages) return;

        try {
          if (!map.getSource('demo-rentals') || map.getLayer('demo-rentals-point')) return;

          map.addLayer({
            id: 'demo-rentals-point',
            type: 'symbol',
            source: 'demo-rentals',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layout: demoRentalIconLayout as any
          });
        } catch (error) {
          console.warn('Could not add the demo rentals layer', error);
          return;
        }

        const popup = new maplibregl.Popup({ closeButton: false, offset: 12 });

        map.on('click', 'demo-rentals-point', (event) => {
          const feature = event.features?.[0];
          if (!feature) return;

          const props = feature.properties || {};
          popup
            .setLngLat(event.lngLat)
            .setHTML(`
              <div style="font-size: 12px; line-height: 1.5">
                <strong>${props.operator_name}</strong><br />
                Vertrokken vanaf hier<br />
                Afstand: ${props.distance_label}
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', 'demo-rentals-point', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'demo-rentals-point', () => {
          map.getCanvas().style.cursor = '';
        });
      });
    },
    [geojson]
  );

  return (
    <DemoWidgetCard
      title="Vertreklocaties (herkomst)"
      description="Waar zijn verhuringen gestart? De kleur laat zien hoe ver het voertuig daarna reed."
      footer={<DistanceLegend />}
    >
      <DemoMap onMapLoad={onMapLoad} zoom={13.2} fitTo={geojson} maxFitZoom={14} />
    </DemoWidgetCard>
  );
}

export default DemoRentalOriginsMap;
