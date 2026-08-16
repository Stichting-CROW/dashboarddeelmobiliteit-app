import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import st from 'geojson-bounds';

import { getMapStyles } from '../../Map/MapUtils/map';
import { demoMapCenter } from './demoData';

interface DemoMapProps {
  /** Called once, after the map style has loaded, to add sources and layers. */
  onMapLoad: (map: maplibregl.Map) => void;
  height?: number;
  zoom?: number;
  center?: [number, number];
  /** GeoJSON to frame after loading, so the data fits whatever the widget width is. */
  fitTo?: unknown;
  fitPadding?: number;
  maxFitZoom?: number;
}

/**
 * Small self-contained MapLibre map for the features page. It has its own map
 * instance (so it never touches window.ddMap) and is only created once it
 * scrolls into view, to avoid spinning up several WebGL contexts at page load.
 */
function DemoMap({
  onMapLoad,
  height = 300,
  zoom = 14,
  center = demoMapCenter,
  fitTo,
  fitPadding = 24,
  maxFitZoom = 16
}: DemoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onMapLoadRef = useRef(onMapLoad);
  const fitToRef = useRef(fitTo);
  const [isInView, setIsInView] = useState(false);

  onMapLoadRef.current = onMapLoad;
  fitToRef.current = fitTo;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyles().base as maplibregl.StyleSpecification,
      center,
      zoom,
      attributionControl: false
    });
    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      if (mapRef.current !== map) return;
      onMapLoadRef.current(map);

      if (!fitToRef.current) return;
      const bounds = st.extent(fitToRef.current as never);
      if (!bounds || bounds.length !== 4) return;
      map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]]
        ],
        { padding: fitPadding, maxZoom: maxFitZoom, duration: 0 }
      );
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, zoom, center[0], center[1]]);

  return (
    <div
      ref={containerRef}
      className="DemoMap w-full overflow-hidden rounded-lg bg-gray-100"
      style={{ height }}
    />
  );
}

export default DemoMap;
