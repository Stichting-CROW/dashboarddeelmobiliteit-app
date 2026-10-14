import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

import MapControlsPortal from './MapControlsPortal';

import './MapAttribution.css';

/**
 * Collects the attribution of every source that is actually drawn right now, so
 * switching background layer (for example to the PDOK aerial imagery) keeps the
 * credits in sync without a second list to maintain.
 */
const getAttributions = (theMap: maplibregl.Map): string[] => {
  let style;
  try {
    style = theMap.getStyle();
  } catch (err) {
    return [];
  }
  if (!style || !style.sources || !style.layers) return [];

  return style.layers.reduce((acc: string[], layer) => {
    const sourceName = (layer as { source?: string }).source;
    if (!sourceName) return acc;
    if (layer.layout && layer.layout.visibility === 'none') return acc;

    const source = style.sources[sourceName] as { attribution?: string };
    const attribution = source && source.attribution;
    if (attribution && acc.indexOf(attribution) === -1) {
      acc.push(attribution);
    }
    return acc;
  }, []);
};

/** Ensure every attribution link opens in a new tab. */
const withNewTabLinks = (html: string): string =>
  html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    let next = attrs;
    if (!/\btarget\s*=/i.test(next)) {
      next += ' target="_blank"';
    }
    if (!/\brel\s*=/i.test(next)) {
      next += ' rel="noopener noreferrer"';
    }
    return `<a${next}>`;
  });

interface MapAttributionProps {
  map: maplibregl.Map | null;
}

const MapAttribution = ({ map }: MapAttributionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [attributions, setAttributions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const syncAttributions = useCallback(() => {
    if (!map) return;
    const next = getAttributions(map);
    setAttributions((current) => {
      const isEqual =
        current.length === next.length &&
        current.every((item, index) => item === next[index]);
      return isEqual ? current : next;
    });
  }, [map]);

  useEffect(() => {
    if (!map) return;

    syncAttributions();
    map.on('styledata', syncAttributions);

    return () => {
      map.off('styledata', syncAttributions);
    };
  }, [map, syncAttributions]);

  useEffect(() => {
    if (!isOpen) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (attributions.length <= 0) return null;

  return (
    <MapControlsPortal map={map} corner="bottom-right" order={1}>
      <div className="MapAttribution" ref={wrapperRef}>
        {isOpen && (
          <div className="MapAttribution-panel text-sm" role="dialog" aria-label="Kaartgegevens">
            {attributions.map((attribution) => (
              <div
                key={attribution}
                className="MapAttribution-line"
                // Attribution markup comes from the bundled map style definitions.
                dangerouslySetInnerHTML={{ __html: withNewTabLinks(attribution) }}
              />
            ))}
          </div>
        )}

        <div className="maplibregl-ctrl-group">
          <button
            type="button"
            className="MapAttribution-button"
            aria-expanded={isOpen}
            aria-label="Toon kaartgegevens"
            title="Kaartgegevens"
            onClick={() => setIsOpen((current) => !current)}
          />
        </div>
      </div>
    </MapControlsPortal>
  );
};

export default MapAttribution;
