export interface BackgroundLayer {
  name: string;
  description: string;
  layerId: string | null;
  sourceId: string | null;
}

export interface BackgroundLayers {
  [key: string]: BackgroundLayer;
}

export declare function getAvailableBackgroundLayers(): BackgroundLayers;
export declare function setBackgroundLayer(
  map: any, 
  layerName: string, 
  onSuccess?: (layerName: string) => void, 
  onError?: (error: string) => void
): void;
export declare function getCurrentBackgroundLayer(map: any): string; 