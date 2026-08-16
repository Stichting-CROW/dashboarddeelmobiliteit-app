import { useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';

import DemoMap from './DemoMap';
import DemoWidgetCard from './DemoWidgetCard';
import {
  demoHubsCenter,
  getDemoHubLogoPointsGeoJson,
  getDemoHubsGeoJson
} from './demoAreas';
import {
  polygonFillStyle,
  polygonLineStyle
} from '../../Map/MapUtils/map.policy_hubs.styles';
import { themes } from '../../../themes';

const HUB_LOGO_URL =
  'https://dashboarddeelmobiliteit.nl/components/MapComponent/hub-icon-mijksenaar.png';

/**
 * Demo version of the Zones map: hubs in the "Definitief actief" phase, drawn
 * with the same polygon styles and hub logo as the app.
 */
function DemoHubsMap() {
  const hubs = useMemo(() => getDemoHubsGeoJson(), []);
  const logoPoints = useMemo(() => getDemoHubLogoPointsGeoJson(), []);

  const onMapLoad = useCallback(
    (map: maplibregl.Map) => {
      map.addSource('demo-hubs', { type: 'geojson', data: hubs as never });
      map.addSource('demo-hub-logos', { type: 'geojson', data: logoPoints as never });

      map.addLayer({
        id: 'demo-hubs-fill',
        type: 'fill',
        source: 'demo-hubs',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: polygonFillStyle as any
      });

      map.addLayer({
        id: 'demo-hubs-border',
        type: 'line',
        source: 'demo-hubs',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: polygonLineStyle as any
      });

      // The hub logo marks every hub while zoomed out, exactly like the app.
      map.loadImage(HUB_LOGO_URL, (error, image) => {
        if (error || !image) return;
        try {
          if (!map.getSource('demo-hub-logos')) return;
          if (!map.hasImage('demo-hub-icon')) {
            map.addImage('demo-hub-icon', image);
          }
          if (map.getLayer('demo-hubs-logo')) return;

          map.addLayer({
            id: 'demo-hubs-logo',
            type: 'symbol',
            source: 'demo-hub-logos',
            layout: {
              'icon-anchor': 'bottom',
              'icon-image': 'demo-hub-icon',
              'icon-size': [
                'interpolate',
                ['exponential', 1.5],
                ['zoom'],
                11, 0.02,
                12, 0.04,
                13, 0.06,
                15, 0.15
              ],
              'icon-allow-overlap': true
            },
            maxzoom: 16
          });
        } catch (loadError) {
          console.warn('Could not add the demo hub logo layer', loadError);
        }
      });

      const popup = new maplibregl.Popup({ closeButton: false, offset: 8 });

      map.on('click', 'demo-hubs-fill', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const props = feature.properties || {};
        popup
          .setLngLat(event.lngLat)
          .setHTML(`
            <div style="font-size: 12px; line-height: 1.5">
              <strong>${props.name}</strong><br />
              Plek voor ${props.capacity} voertuigen<br />
              Fase: Definitief actief
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'demo-hubs-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'demo-hubs-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    },
    [hubs, logoPoints]
  );

  return (
    <DemoWidgetCard
      title="Hubs in de fase Definitief actief"
      description="Ingetekende hubs zoals die nu gelden. Zoom in om de vorm van elke hub te zien, of klik een hub aan."
      footer={
        <div className="flex items-center text-xs text-gray-600">
          <span
            className="mr-2 inline-block rounded"
            style={{
              width: 12,
              height: 12,
              backgroundColor: themes.zone.stop.primaryColor,
              opacity: 0.8
            }}
          />
          Hub (parkeerplek voor deelvoertuigen)
        </div>
      }
    >
      <DemoMap
        onMapLoad={onMapLoad}
        zoom={15.2}
        center={demoHubsCenter}
        fitTo={hubs}
        maxFitZoom={15.6}
      />
    </DemoWidgetCard>
  );
}

export default DemoHubsMap;
