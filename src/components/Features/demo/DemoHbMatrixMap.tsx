import { useCallback, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { gridDisk, gridDistance, latLngToCell } from 'h3-js';
import geojson2h3 from 'geojson2h3';

import DemoMap from './DemoMap';
import DemoWidgetCard from './DemoWidgetCard';
import { demoMapCenter } from './demoData';

const H3_RESOLUTION = 7;
const GRID_RADIUS = 4;
/** Fixed maximum, so the color scale stays the same when another origin is picked. */
const MAX_TRIPS = 120;

/** Color ramp for destinations, identical to the 'bestemming' scale of the HB map. */
const destinationColors = [
  'rgba(255, 255, 255, 0)',
  '#FE7279',
  '#FD5D65',
  '#FD4952',
  '#FD353F',
  '#FD212C',
  '#FD0D19',
  '#F2020E',
  '#DE020D',
  '#CA020C',
  '#B6020B'
];

/** Same discrete steps the HB map uses: a color per 10% of the maximum. */
function getFillColorExpression(): unknown[] {
  const expression: unknown[] = ['step', ['get', 'value'], destinationColors[0]];
  expression.push(1, destinationColors[1]);
  for (let percentage = 10; percentage <= 90; percentage += 10) {
    expression.push(
      (MAX_TRIPS * percentage) / 100,
      destinationColors[Math.floor(percentage / 10) + 1]
    );
  }
  return expression;
}

/** Stable per-cell variation, so the pattern looks organic but never changes. */
function cellNoise(cell: string): number {
  let hash = 0;
  for (let i = 0; i < cell.length; i++) {
    hash = (hash * 31 + cell.charCodeAt(i)) % 100000;
  }
  return 0.55 + (hash % 100) / 100 * 0.9;
}

function buildHexagonCollection(originCell: string, cells: string[]) {
  return geojson2h3.h3SetToFeatureCollection(cells, (cell: string) => {
    const distance = gridDistance(originCell, cell);
    // Most rentals end close to where they started; further away is rarer.
    const trips = Math.round(MAX_TRIPS * Math.exp(-distance / 1.7) * cellNoise(cell));
    return {
      value: distance < 0 ? 0 : trips,
      selected: cell === originCell ? 1 : 0
    };
  });
}

/**
 * Demo version of the HB-matrix on the Verhuringen map: pick a hexagon and see
 * where the rentals that started there ended up. Uses H3 resolution 7, like the
 * "HB" layer in the app.
 */
function DemoHbMatrixMap() {
  const originRef = useRef(latLngToCell(demoMapCenter[1], demoMapCenter[0], H3_RESOLUTION));
  const cellsRef = useRef(gridDisk(originRef.current, GRID_RADIUS));
  const initialCollection = useMemo(
    () => buildHexagonCollection(originRef.current, cellsRef.current),
    []
  );

  const onMapLoad = useCallback((map: maplibregl.Map) => {
    map.addSource('demo-h3-hexes', {
      type: 'geojson',
      data: initialCollection
    });

    map.addLayer({
      id: 'demo-h3-hexes-fill',
      type: 'fill',
      source: 'demo-h3-hexes',
      paint: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'fill-color': getFillColorExpression() as any,
        'fill-opacity': 0.6
      }
    });

    map.addLayer({
      id: 'demo-h3-hexes-border',
      type: 'line',
      source: 'demo-h3-hexes',
      paint: {
        'line-color': ['case', ['==', ['get', 'selected'], 1], '#15aeef', '#DDD'],
        'line-width': ['case', ['==', ['get', 'selected'], 1], 5, 1]
      }
    });

    map.addLayer({
      id: 'demo-h3-hexes-values',
      type: 'symbol',
      source: 'demo-h3-hexes',
      layout: {
        'text-field': ['case', ['>', ['get', 'value'], 0], ['get', 'value'], ''],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11
      },
      paint: {
        'text-color': '#333',
        'text-halo-color': '#fff',
        'text-halo-width': 1
      }
    });

    // Clicking another hexagon makes it the new origin, like in the app.
    map.on('click', 'demo-h3-hexes-fill', (event) => {
      const cell = latLngToCell(event.lngLat.lat, event.lngLat.lng, H3_RESOLUTION);
      if (cellsRef.current.indexOf(cell) === -1) return;

      originRef.current = cell;
      const source = map.getSource('demo-h3-hexes') as maplibregl.GeoJSONSource;
      if (!source) return;
      source.setData(
        buildHexagonCollection(cell, cellsRef.current) as never
      );
    });

    map.on('mouseenter', 'demo-h3-hexes-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'demo-h3-hexes-fill', () => {
      map.getCanvas().style.cursor = '';
    });
  }, [initialCollection]);

  return (
    <DemoWidgetCard
      title="HB-matrix: waar ging men heen?"
      description="Kies een zeshoek en zie waar de verhuringen die daar startten eindigden. Klik een andere zeshoek om te vergelijken."
      footer={
        <div className="flex items-center text-xs text-gray-600">
          <span className="mr-2">Minder</span>
          <span
            className="inline-block rounded"
            style={{
              width: 90,
              height: 10,
              background: `linear-gradient(to right, ${destinationColors.slice(1).join(', ')})`
            }}
          />
          <span className="ml-2">meer verhuringen</span>
        </div>
      }
    >
      <DemoMap
        onMapLoad={onMapLoad}
        zoom={10.4}
        fitTo={initialCollection}
        fitPadding={4}
        maxFitZoom={12}
      />
    </DemoWidgetCard>
  );
}

export default DemoHbMatrixMap;
