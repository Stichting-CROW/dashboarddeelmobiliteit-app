import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, Polygon } from 'geojson';

import { StateType } from '../../../types/StateType';
import { canMutateMapLayers } from '../MapUtils/mapGuards';
import MapControlsPortal from './MapControlsPortal';

import './LassoTool.css';

const SOURCE_ID = 'lasso';
const FILL_LAYER_ID = 'lasso-fill';
const LINE_LAYER_ID = 'lasso-line';

/** Close the drawn path back to its first point, so it can be shown while drawing. */
const toPolygon = (points: number[][]): Feature<Polygon> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [[...points, points[0]]] }
});

interface LassoToolProps {
  map: maplibregl.Map | null;
}

/**
 * Map button to select vehicles: drag a lasso around them to count them. The
 * count is derived from the vehicles in the store, so it follows changes to the
 * date and filters while the lasso stays in place.
 */
const LassoTool = ({ map }: LassoToolProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lasso, setLasso] = useState<Feature<Polygon> | null>(null);
  const isActive = isDrawing || lasso !== null;

  // The vehicles shown on the map, already filtered on operator and parking duration
  const vehicles = useSelector((state: StateType) => state.vehicles.data);

  const vehicleCount = useMemo(() => {
    if (!lasso) return null;
    return (vehicles.features || [])
      .filter((vehicle) => booleanPointInPolygon(vehicle, lasso))
      .length;
  }, [vehicles, lasso]);

  const close = () => {
    setIsDrawing(false);
    setLasso(null);
  };

  // While active: show the lasso on the map, and close on Escape
  useEffect(() => {
    if (!map || !isActive) return;

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: { 'fill-color': '#15AEEF', 'fill-opacity': 0.15 }
    });
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: { 'line-color': '#15AEEF', 'line-width': 2, 'line-dasharray': [2, 1] }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // On leaving the map pages the map is removed, and the lasso with it
      if (!canMutateMapLayers(map)) return;
      map.removeLayer(LINE_LAYER_ID);
      map.removeLayer(FILL_LAYER_ID);
      map.removeSource(SOURCE_ID);
    };
  }, [map, isActive]);

  // While drawing: dragging draws the lasso instead of panning the map
  useEffect(() => {
    if (!map || !isDrawing) return;

    const canvas = map.getCanvas();
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    let points: number[][] = [];

    const toLngLat = (event: PointerEvent) => {
      const { lng, lat } = map.unproject([event.offsetX, event.offsetY]);
      return [lng, lat];
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // Keep receiving the pointer events if the pointer leaves the map
      canvas.setPointerCapture(event.pointerId);
      points = [toLngLat(event)];
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!canvas.hasPointerCapture(event.pointerId)) return;
      points.push(toLngLat(event));
      source.setData(toPolygon(points));
    };
    const onPointerUp = () => {
      // A click without dragging is not a lasso
      if (points.length < 3) return;
      setLasso(toPolygon(points));
      setIsDrawing(false);
    };

    map.dragPan.disable();
    map.getCanvasContainer().classList.add('LassoTool-drawing');
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    return () => {
      map.dragPan.enable();
      map.getCanvasContainer().classList.remove('LassoTool-drawing');
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [map, isDrawing]);

  return (
    <MapControlsPortal map={map} corner="bottom-right" order={-2}>
      <div className="LassoTool">
        {isActive && (
          <div className="LassoTool-panel text-sm" role="status">
            {vehicleCount === null
              ? 'Trek een lijn rond voertuigen om ze te selecteren'
              : `${vehicleCount.toLocaleString('nl-NL')} ${vehicleCount === 1 ? 'voertuig' : 'voertuigen'} in selectie`}
          </div>
        )}

        <div className="maplibregl-ctrl-group">
          <button
            type="button"
            className="LassoTool-button"
            aria-pressed={isActive}
            aria-label="Selecteer voertuigen"
            title="Selecteer voertuigen"
            onClick={() => (isActive ? close() : setIsDrawing(true))}
          />
        </div>
      </div>
    </MapControlsPortal>
  );
};

export default LassoTool;
