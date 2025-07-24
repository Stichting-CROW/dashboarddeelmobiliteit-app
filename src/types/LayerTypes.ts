export interface LayerConfig {
  id: string;
  name: string;
  type: 'background' | 'data' | 'overlay';
  category: 'base' | 'satellite' | 'hybrid' | 'zones' | 'vehicles' | 'rentals' | 'policy-hubs';
  source?: string;
  visible: boolean;
  order: number;
  description?: string;
  icon?: string;
}

export interface LayerPreset {
  id: string;
  name: string;
  description: string;
  layers: string[];
  category: 'park' | 'rentals' | 'zones' | 'policy-hubs';
}

export interface LayerState {
  activePreset: string | null;
  visibleLayers: string[];
  baseLayer: 'base' | 'satellite' | 'hybrid';
  zonesVisible: boolean;
  customLayers: string[];
}

export interface LayerManagerConfig {
  presets: LayerPreset[];
  layers: Record<string, LayerConfig>;
}

export type DisplayMode = 'park' | 'rentals' | 'zones' | 'policy-hubs' | 'start';

export type ViewMode = 'heatmap' | 'clusters' | 'points' | 'hb'; 