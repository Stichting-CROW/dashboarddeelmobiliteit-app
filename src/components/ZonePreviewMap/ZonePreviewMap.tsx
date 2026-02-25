import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import st from 'geojson-bounds';

import { StateType } from '../../types/StateType';
import { getZoneById } from '../Map/MapUtils/zones';
import { getMapStyles } from '../Map/MapUtils/map';
import {
  polygonFillStyle,
  polygonLineStyle
} from '../Map/MapUtils/map.policy_hubs.styles';

const MAP_WIDTH = 200;
const MAP_HEIGHT = 200;

interface ZonePreviewMapProps {
  className?: string;
}

/**
 * Small map tile (200x200px) that shows the polygon of the selected zone.
 * Only renders when exactly 1 zone is selected.
 * Uses the same polygon styles as the beleidshubs map.
 */
function ZonePreviewMap({ className = '' }: ZonePreviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const zones = useSelector((state: StateType) =>
    state.metadata?.zones ? state.metadata.zones : []
  );
  const filterZones = useSelector((state: StateType) =>
    state.filter?.zones ?? null
  );
  const zonesGeodata = useSelector((state: StateType) =>
    state.zones_geodata ?? null
  );

  const selectedZoneIds =
    filterZones && typeof filterZones === 'string'
      ? filterZones.split(',').map((id) => parseInt(id.trim(), 10)).filter(Boolean)
      : [];

  const hasExactlyOneZone = selectedZoneIds.length === 1;
  const selectedZone = hasExactlyOneZone
    ? getZoneById(zones, selectedZoneIds[0])
    : null;
  const geographyType =
    selectedZone?.geography_type &&
    ['stop', 'no_parking', 'monitoring'].includes(selectedZone.geography_type)
      ? selectedZone.geography_type
      : 'monitoring';

  useEffect(() => {
    if (
      !hasExactlyOneZone ||
      !mapContainerRef.current ||
      !zonesGeodata?.data?.features?.length
    ) {
      return;
    }

    const feature = zonesGeodata.data.features[0];
    if (!feature?.geometry) return;

    const geojsonWithProps = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {
            geography_type: geographyType,
            is_selected: 1,
            is_in_drawing_mode: 0,
            phase: 'published'
          },
          geometry: feature.geometry
        }
      ]
    };

    const mapStyles = getMapStyles();
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyles.base as maplibregl.StyleSpecification,
      center: [0, 0],
      zoom: 10,
      interactive: false,
      attributionControl: false
    });

    // Add compact attribution: info icon only by default, "Mapbox" on click
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('zone-preview', {
        type: 'geojson',
        data: geojsonWithProps
      });

      map.addLayer({
        id: 'zone-preview-fill',
        type: 'fill',
        source: 'zone-preview',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: polygonFillStyle as any
      });

      map.addLayer({
        id: 'zone-preview-border',
        type: 'line',
        source: 'zone-preview',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: polygonLineStyle as any
      });

      const bounds = st.extent(geojsonWithProps);
      if (bounds && bounds.length === 4) {
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]]
          ],
          {
            padding: 12,
            duration: 0
          }
        );
      }

      // Hide Mapbox label by default; user can click info icon to reveal it.
      // Defer so we run after MapLibre's sourcedata-triggered _updateCompact.
      setTimeout(() => {
        map.getContainer().querySelectorAll('.maplibregl-ctrl-attrib').forEach((el) => {
          el.classList.remove('maplibregl-compact-show', 'mapboxgl-compact-show');
        });
      }, 0);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    hasExactlyOneZone,
    zonesGeodata?.data?.features,
    geographyType,
    zonesGeodata?.filter
  ]);

  if (!hasExactlyOneZone || !zonesGeodata?.data?.features?.length) {
    return null;
  }

  return (
    <div
      className={`ZonePreviewMap overflow-hidden rounded border border-gray-200 ${className}`}
      style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default ZonePreviewMap;
