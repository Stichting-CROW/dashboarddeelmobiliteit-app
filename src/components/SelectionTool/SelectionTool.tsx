import { useCallback, useEffect, useMemo, useState } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import './SelectionTool.css';

type SelectionMode = 'polygon' | 'lasso';

type SelectionToolProps = {
  map: any;
  vehicles: any;
};

const EMPTY_SELECTION = {
  type: 'FeatureCollection',
  features: []
};

const SELECTION_SOURCE_ID = 'vehicle-selection-tool';
const SELECTION_FILL_LAYER_ID = 'vehicle-selection-tool-fill';
const SELECTION_LINE_LAYER_ID = 'vehicle-selection-tool-line';
const MIN_POINTS = 3;

const createPolygonFeatureCollection = (coordinates) => ({
  type: 'FeatureCollection',
  features: coordinates.length >= MIN_POINTS ? [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[...coordinates, coordinates[0]]]
    }
  }] : []
});

const SelectionTool = ({ map, vehicles }: SelectionToolProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<SelectionMode | null>(null);
  const [coordinates, setCoordinates] = useState<any[]>([]);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);

  const vehicleFeatures = useMemo(() => {
    return vehicles?.data?.features || [];
  }, [vehicles?.data]);

  const updateSelectionSource = useCallback((nextCoordinates) => {
    if (!map || !map.getSource(SELECTION_SOURCE_ID)) return;
    map.getSource(SELECTION_SOURCE_ID).setData(createPolygonFeatureCollection(nextCoordinates));
  }, [map]);

  const clearSelection = useCallback(() => {
    setCoordinates([]);
    setVehicleCount(null);
    updateSelectionSource([]);
  }, [updateSelectionSource]);

  const finishSelection = useCallback((nextCoordinates = coordinates) => {
    if (nextCoordinates.length < MIN_POINTS) return;

    const polygon = createPolygonFeatureCollection(nextCoordinates).features[0];
    const count = vehicleFeatures.filter((feature) => {
      return feature?.geometry?.type === 'Point' && booleanPointInPolygon(feature, polygon as any);
    }).length;

    setCoordinates(nextCoordinates);
    setVehicleCount(count);
    setActiveMode(null);
    updateSelectionSource(nextCoordinates);
  }, [coordinates, updateSelectionSource, vehicleFeatures]);

  const startSelection = (mode: SelectionMode) => {
    clearSelection();
    setActiveMode(mode);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!map) return;

    const addSelectionLayers = () => {
      if (!map || !map.isStyleLoaded()) return;
      if (!map.getSource(SELECTION_SOURCE_ID)) {
        map.addSource(SELECTION_SOURCE_ID, {
          type: 'geojson',
          data: EMPTY_SELECTION
        });
      }
      if (!map.getLayer(SELECTION_FILL_LAYER_ID)) {
        map.addLayer({
          id: SELECTION_FILL_LAYER_ID,
          type: 'fill',
          source: SELECTION_SOURCE_ID,
          paint: {
            'fill-color': '#0f1c3f',
            'fill-opacity': 0.16
          }
        });
      }
      if (!map.getLayer(SELECTION_LINE_LAYER_ID)) {
        map.addLayer({
          id: SELECTION_LINE_LAYER_ID,
          type: 'line',
          source: SELECTION_SOURCE_ID,
          paint: {
            'line-color': '#0f1c3f',
            'line-width': 3,
            'line-dasharray': [2, 1]
          }
        });
      }
    };

    if (map.isStyleLoaded()) addSelectionLayers();
    map.on('load', addSelectionLayers);
    map.on('styledata', addSelectionLayers);

    return () => {
      map.off('load', addSelectionLayers);
      map.off('styledata', addSelectionLayers);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !activeMode) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    const previousDragPanState = map.dragPan.isEnabled();
    canvas.style.cursor = 'crosshair';

    const addCoordinate = (lngLat) => {
      setCoordinates((current) => {
        const next = [...current, [lngLat.lng, lngLat.lat]];
        updateSelectionSource(next);
        return next;
      });
    };

    const onClick = (event) => {
      if (activeMode !== 'polygon') return;
      addCoordinate(event.lngLat);
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      finishSelection();
    };

    const onMouseDown = (event) => {
      if (activeMode !== 'lasso') return;
      event.preventDefault();
      if (previousDragPanState) map.dragPan.disable();
      const next = [[event.lngLat.lng, event.lngLat.lat]];
      setCoordinates(next);
      updateSelectionSource(next);
    };

    const onMouseMove = (event) => {
      if (activeMode !== 'lasso' || coordinates.length === 0) return;
      setCoordinates((current) => {
        const next = [...current, [event.lngLat.lng, event.lngLat.lat]];
        updateSelectionSource(next);
        return next;
      });
    };

    const onMouseUp = () => {
      if (activeMode !== 'lasso') return;
      finishSelection();
    };

    map.on('click', onClick);
    map.on('contextmenu', onContextMenu);
    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('click', onClick);
      map.off('contextmenu', onContextMenu);
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      canvas.style.cursor = previousCursor;
      if (previousDragPanState && !map.dragPan.isEnabled()) map.dragPan.enable();
    };
  }, [activeMode, coordinates.length, finishSelection, map, updateSelectionSource]);

  useEffect(() => {
    if (coordinates.length >= MIN_POINTS && vehicleCount !== null) {
      finishSelection(coordinates);
    }
  }, [vehicleFeatures]);

  return <div className="SelectionTool">
    {isOpen && <div className="SelectionTool-panel">
      <strong>Selectie</strong>
      <p>{activeMode === 'polygon' ? 'Klik punten op de kaart. Rechtsklik om af te ronden.' : activeMode === 'lasso' ? 'Klik en sleep om een lasso te tekenen.' : 'Teken een gebied om voertuigen te tellen.'}</p>
      {vehicleCount !== null && <div className="SelectionTool-result">{vehicleCount} voertuigen in selectie</div>}
      <div className="SelectionTool-actions">
        <button type="button" className={activeMode === 'polygon' ? 'is-active' : ''} onClick={() => startSelection('polygon')}>Polygoon</button>
        <button type="button" className={activeMode === 'lasso' ? 'is-active' : ''} onClick={() => startSelection('lasso')}>Lasso</button>
        <button type="button" onClick={clearSelection}>Wis</button>
      </div>
    </div>}
    <button type="button" className={`SelectionTool-toggle ${activeMode ? 'is-active' : ''}`} aria-label="Voertuigen selecteren" onClick={() => setIsOpen((current) => !current)}>⌁</button>
  </div>;
};

export default SelectionTool;
