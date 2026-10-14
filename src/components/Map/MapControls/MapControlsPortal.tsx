import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';

export type MapControlCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

interface MapControlsPortalProps {
  map: maplibregl.Map | null;
  corner?: MapControlCorner;
  /**
   * Position within the corner stack. MapLibre's own controls (zoom, geolocate)
   * have order 0, so use a negative value to stack above them.
   */
  order?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Renders React map buttons into MapLibre's own control container for a corner.
 * That container is the single wrapper for every button in that corner, so
 * spacing and stacking are handled automatically instead of per-component
 * `position: fixed` offsets.
 */
export const MapControlsPortal = ({
  map,
  corner = 'bottom-right',
  order = 0,
  className,
  children
}: MapControlsPortalProps) => {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const container = map
      .getContainer()
      .querySelector(`.maplibregl-ctrl-${corner}`);
    if (!container) return;

    const element = document.createElement('div');
    element.className = ['maplibregl-ctrl', className].filter(Boolean).join(' ');
    element.style.order = String(order);
    container.appendChild(element);
    setHost(element);

    return () => {
      element.remove();
      setHost(null);
    };
  }, [map, corner, order, className]);

  if (!host) return null;

  return createPortal(children, host);
};

export default MapControlsPortal;
