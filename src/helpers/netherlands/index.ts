import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { MultiPolygon } from 'geojson';

import netherlandsOutline from './netherlandsOutline.json';

/**
 * Simplified outline (~100m tolerance) of the 'Nederland' country zone
 * (zone_id 51233), without the Baarle-Hertog enclaves.
 */
const NETHERLANDS_OUTLINE = netherlandsOutline as MultiPolygon;

// [minLng, minLat, maxLng, maxLat] of NETHERLANDS_OUTLINE
const NETHERLANDS_BBOX = [3.3079, 50.7504, 7.2275, 53.5764] as const;

/**
 * Whether a coordinate lies within the (approximate) Netherlands.
 */
export const isInNetherlands = (lng: number, lat: number): boolean => {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  const [minLng, minLat, maxLng, maxLat] = NETHERLANDS_BBOX;
  if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) return false;
  return booleanPointInPolygon([lng, lat], NETHERLANDS_OUTLINE);
};
