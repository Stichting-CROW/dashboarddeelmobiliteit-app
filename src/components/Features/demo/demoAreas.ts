/**
 * Demo polygons for the Servicegebieden and Zones widgets on the features page.
 * Shapes are hand-made around Rotterdam; they are not real service areas or hubs.
 */

export type PolygonFeatureCollection = {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: Record<string, string | number | boolean>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }[];
};

/** Roughly the built-up area of a city, with one excluded area inside it. */
const serviceAreaOuterRing: number[][] = [
  [4.4075, 51.9455],
  [4.4340, 51.9520],
  [4.4680, 51.9540],
  [4.4990, 51.9480],
  [4.5210, 51.9380],
  [4.5330, 51.9235],
  [4.5290, 51.9080],
  [4.5100, 51.8965],
  [4.4830, 51.8900],
  [4.4520, 51.8885],
  [4.4245, 51.8950],
  [4.4050, 51.9075],
  [4.3960, 51.9235],
  [4.4000, 51.9370],
  [4.4075, 51.9455]
];

/** Area without service, for example a port area. */
const serviceAreaHole: number[][] = [
  [4.4360, 51.9020],
  [4.4600, 51.9020],
  [4.4640, 51.8955],
  [4.4380, 51.8940],
  [4.4360, 51.9020]
];

export function getDemoServiceAreaGeoJson(operatorName: string): PolygonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          operator_name: operatorName,
          selected: 0
        },
        geometry: {
          type: 'Polygon',
          coordinates: [serviceAreaOuterRing, serviceAreaHole]
        }
      }
    ]
  };
}

export const demoServiceAreaCenter: [number, number] = [4.4645, 51.9215];

/** Meters per degree, good enough for hub-sized rectangles. */
const METERS_PER_DEGREE_LAT = 111320;

function rectangle(
  center: [number, number],
  widthInMeters: number,
  heightInMeters: number,
  rotationInDegrees: number
): number[][] {
  const latToDegrees = 1 / METERS_PER_DEGREE_LAT;
  const lngToDegrees = 1 / (METERS_PER_DEGREE_LAT * Math.cos((center[1] * Math.PI) / 180));
  const halfWidth = widthInMeters / 2;
  const halfHeight = heightInMeters / 2;
  const radians = (rotationInDegrees * Math.PI) / 180;

  const corners: [number, number][] = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight]
  ];

  const ring = corners.map(([x, y]) => {
    const rotatedX = x * Math.cos(radians) - y * Math.sin(radians);
    const rotatedY = x * Math.sin(radians) + y * Math.cos(radians);
    return [
      Number((center[0] + rotatedX * lngToDegrees).toFixed(6)),
      Number((center[1] + rotatedY * latToDegrees).toFixed(6))
    ];
  });

  return [...ring, ring[0]];
}

interface DemoHub {
  name: string;
  center: [number, number];
  width: number;
  height: number;
  rotation: number;
  capacity: number;
}

/** Hubs along a few streets, sized like real parking spots for shared vehicles. */
const demoHubs: DemoHub[] = [
  { name: 'Stationsplein Noord', center: [4.4700, 51.9245], width: 34, height: 12, rotation: 8, capacity: 24 },
  { name: 'Weena West', center: [4.4655, 51.9230], width: 28, height: 10, rotation: 82, capacity: 16 },
  { name: 'Kruisplein', center: [4.4675, 51.9205], width: 30, height: 11, rotation: 15, capacity: 20 },
  { name: 'Schouwburgplein', center: [4.4715, 51.9215], width: 26, height: 12, rotation: 100, capacity: 14 },
  { name: 'Hofplein Zuid', center: [4.4760, 51.9250], width: 32, height: 11, rotation: 25, capacity: 18 },
  { name: 'Delftsestraat', center: [4.4725, 51.9265], width: 24, height: 10, rotation: 70, capacity: 12 },
  { name: 'Karel Doormanstraat', center: [4.4690, 51.9185], width: 27, height: 10, rotation: 95, capacity: 15 },
  { name: 'Mauritsweg', center: [4.4640, 51.9190], width: 25, height: 11, rotation: 40, capacity: 10 }
];

/**
 * Hub polygons plus the center points the map uses for the hub logo when you
 * are zoomed out, in the same shape as the policy_hubs source in the app.
 */
export function getDemoHubsGeoJson(): PolygonFeatureCollection {
  const features: PolygonFeatureCollection['features'] = [];

  demoHubs.forEach((hub, index) => {
    features.push({
      type: 'Feature',
      properties: {
        id: index + 1,
        name: hub.name,
        geography_type: 'stop',
        phase: 'active',
        capacity: hub.capacity,
        is_selected: 0,
        is_in_drawing_mode: 0
      },
      geometry: {
        type: 'Polygon',
        coordinates: [rectangle(hub.center, hub.width, hub.height, hub.rotation)]
      }
    });
  });

  return { type: 'FeatureCollection', features };
}

export function getDemoHubLogoPointsGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: demoHubs.map((hub, index) => ({
      type: 'Feature' as const,
      properties: {
        id: index + 1,
        name: hub.name,
        geography_type: 'stop',
        phase: 'active',
        capacity: hub.capacity,
        is_logo_point: true
      },
      geometry: { type: 'Point' as const, coordinates: hub.center }
    }))
  };
}

export const demoHubsCenter: [number, number] = [4.4695, 51.9225];
