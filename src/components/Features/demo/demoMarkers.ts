import maplibregl from 'maplibre-gl';

import { getVehicleMarkers } from '../../Map/vehicle_marker.js';
import { demoOperators } from './demoData';

const MARKER_SIZE = 50;

/**
 * Registers the same marker sprites the Aanbod map uses, for the demo
 * operators only: an outer ring in the parkeerduur color, plus an operator
 * badge or a warning triangle for non-operational vehicles.
 */
export async function addDemoVehicleImages(map: maplibregl.Map): Promise<boolean> {
  try {
    const results = await Promise.all(
      demoOperators.map(async (operator) => {
        const [operational, nonOperational] = await Promise.all([
          getVehicleMarkers(operator.color, false),
          getVehicleMarkers(operator.color, true)
        ]);
        return { operator, operational, nonOperational };
      })
    );

    // The map may have been removed while the sprites were being rasterized.
    results.forEach(({ operator, operational, nonOperational }) => {
      operational.forEach((data: Uint8Array, bin: number) => {
        const id = `${operator.system_id}-p:${bin}`;
        if (map.hasImage(id)) return;
        map.addImage(id, { width: MARKER_SIZE, height: MARKER_SIZE, data });
      });
      nonOperational.forEach((data: Uint8Array, bin: number) => {
        const id = `${operator.system_id}-p-n:${bin}`;
        if (map.hasImage(id)) return;
        map.addImage(id, { width: MARKER_SIZE, height: MARKER_SIZE, data });
      });
    });

    return true;
  } catch (error) {
    console.warn('Could not add demo vehicle markers to the features page map', error);
    return false;
  }
}

/** Same icon-image expression as the production vehicles-point layer. */
export const demoVehicleIconLayout = {
  'icon-image': [
    'concat',
    ['get', 'system_id'],
    ['case', ['==', ['get', 'is_non_operational'], true], '-p-n:', '-p:'],
    ['get', 'duration_bin']
  ],
  'icon-size': [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    0.25,
    16,
    0.7
  ],
  'icon-allow-overlap': true
};
