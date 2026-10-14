import type { ServiceAreaHistoryEvent } from './ServiceAreaHistoryEvent';

export interface ServiceArea extends ServiceAreaHistoryEvent {
  geometries: GeoJSON.FeatureCollection;
}
