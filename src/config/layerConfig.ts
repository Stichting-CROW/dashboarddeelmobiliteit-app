import { LayerManagerConfig, LayerConfig, LayerPreset } from '../types/LayerTypes';

// Define all available layers
const layers: Record<string, LayerConfig> = {
  // Base layers
  'base': {
    id: 'base',
    name: 'Standaard',
    type: 'background',
    category: 'base',
    visible: true,
    order: 1,
    description: 'Standaard kaartlaag met wegen en gebouwen'
  },
  'satellite': {
    id: 'satellite',
    name: 'Luchtfoto',
    type: 'background',
    category: 'satellite',
    visible: false,
    order: 1,
    description: 'Satellietbeelden van PDOK'
  },
  'hybrid': {
    id: 'hybrid',
    name: 'Hybride',
    type: 'background',
    category: 'hybrid',
    visible: false,
    order: 1,
    description: 'Hybride kaart met satellietbeelden en labels'
  },

  // Zone layers
  'zones-geodata': {
    id: 'zones-geodata',
    name: 'CBS-gebied',
    type: 'overlay',
    category: 'zones',
    source: 'zones-geodata',
    visible: false,
    order: 10,
    description: 'CBS-gebiedsgrenzen'
  },
  'zones-geodata-border': {
    id: 'zones-geodata-border',
    name: 'CBS-gebied grenzen',
    type: 'overlay',
    category: 'zones',
    source: 'zones-geodata',
    visible: false,
    order: 11,
    description: 'Grenzen van CBS-gebieden'
  },
  'zones-isochrones': {
    id: 'zones-isochrones',
    name: 'Isochronen',
    type: 'overlay',
    category: 'zones',
    source: 'zones-isochrones',
    visible: true,
    order: 12,
    description: 'Reistijd-isochronen'
  },
  'zones-metrics-public': {
    id: 'zones-metrics-public',
    name: 'Zone metrics',
    type: 'data',
    category: 'zones',
    source: 'zones-metrics-public',
    visible: false,
    order: 13,
    description: 'Publieke zone metrics'
  },
  'zones-metrics-public-border': {
    id: 'zones-metrics-public-border',
    name: 'Zone metrics grenzen',
    type: 'data',
    category: 'zones',
    source: 'zones-metrics-public',
    visible: false,
    order: 14,
    description: 'Grenzen van zone metrics'
  },

  // Vehicle layers
  'vehicles-point': {
    id: 'vehicles-point',
    name: 'Voertuigen',
    type: 'data',
    category: 'vehicles',
    source: 'vehicles',
    visible: false,
    order: 20,
    description: 'Individuele voertuigen als punten'
  },
  'vehicles-clusters': {
    id: 'vehicles-clusters',
    name: 'Voertuigen clusters',
    type: 'data',
    category: 'vehicles',
    source: 'vehicles-clusters',
    visible: false,
    order: 21,
    description: 'Gegroepeerde voertuigen'
  },
  'vehicles-clusters-count': {
    id: 'vehicles-clusters-count',
    name: 'Cluster aantallen',
    type: 'data',
    category: 'vehicles',
    source: 'vehicles-clusters',
    visible: false,
    order: 22,
    description: 'Aantal voertuigen per cluster'
  },
  'vehicles-clusters-point': {
    id: 'vehicles-clusters-point',
    name: 'Cluster punten',
    type: 'data',
    category: 'vehicles',
    source: 'vehicles-clusters',
    visible: false,
    order: 23,
    description: 'Punten voor clusters'
  },
  'vehicles-heatmap': {
    id: 'vehicles-heatmap',
    name: 'Voertuigen heatmap',
    type: 'data',
    category: 'vehicles',
    source: 'vehicles',
    visible: false,
    order: 24,
    description: 'Heatmap van voertuigdichtheid'
  },

  // Rental layers - Origins
  'rentals-origins-point': {
    id: 'rentals-origins-point',
    name: 'Verhuringen herkomst',
    type: 'data',
    category: 'rentals',
    source: 'rentals-origins',
    visible: false,
    order: 30,
    description: 'Startpunten van verhuringen'
  },
  'rentals-origins-clusters': {
    id: 'rentals-origins-clusters',
    name: 'Herkomst clusters',
    type: 'data',
    category: 'rentals',
    source: 'rentals-origins-clusters',
    visible: false,
    order: 31,
    description: 'Gegroepeerde herkomstpunten'
  },
  'rentals-origins-clusters-count': {
    id: 'rentals-origins-clusters-count',
    name: 'Herkomst cluster aantallen',
    type: 'data',
    category: 'rentals',
    source: 'rentals-origins-clusters',
    visible: false,
    order: 32,
    description: 'Aantal verhuringen per herkomstcluster'
  },
  'rentals-origins-clusters-point': {
    id: 'rentals-origins-clusters-point',
    name: 'Herkomst cluster punten',
    type: 'data',
    category: 'rentals',
    source: 'rentals-origins-clusters',
    visible: false,
    order: 33,
    description: 'Punten voor herkomstclusters'
  },
  'rentals-origins-heatmap': {
    id: 'rentals-origins-heatmap',
    name: 'Herkomst heatmap',
    type: 'data',
    category: 'rentals',
    source: 'rentals-origins',
    visible: false,
    order: 34,
    description: 'Heatmap van herkomstdichtheid'
  },

  // Rental layers - Destinations
  'rentals-destinations-point': {
    id: 'rentals-destinations-point',
    name: 'Verhuringen bestemming',
    type: 'data',
    category: 'rentals',
    source: 'rentals-destinations',
    visible: false,
    order: 40,
    description: 'Eindpunten van verhuringen'
  },
  'rentals-destinations-clusters': {
    id: 'rentals-destinations-clusters',
    name: 'Bestemming clusters',
    type: 'data',
    category: 'rentals',
    source: 'rentals-destinations-clusters',
    visible: false,
    order: 41,
    description: 'Gegroepeerde bestemmingspunten'
  },
  'rentals-destinations-clusters-count': {
    id: 'rentals-destinations-clusters-count',
    name: 'Bestemming cluster aantallen',
    type: 'data',
    category: 'rentals',
    source: 'rentals-destinations-clusters',
    visible: false,
    order: 42,
    description: 'Aantal verhuringen per bestemmingscluster'
  },
  'rentals-destinations-clusters-point': {
    id: 'rentals-destinations-clusters-point',
    name: 'Bestemming cluster punten',
    type: 'data',
    category: 'rentals',
    source: 'rentals-destinations-clusters',
    visible: false,
    order: 43,
    description: 'Punten voor bestemmingsclusters'
  },
  'rentals-destinations-heatmap': {
    id: 'rentals-destinations-heatmap',
    name: 'Bestemming heatmap',
    type: 'data',
    category: 'rentals',
    source: 'rentals-destinations',
    visible: false,
    order: 44,
    description: 'Heatmap van bestemmingsdichtheid'
  }
};

// Define layer presets for different display modes
const presets: LayerPreset[] = [
  // Park mode presets
  {
    id: 'park-points',
    name: 'Voertuigen',
    description: 'Toon individuele voertuigen als punten',
    category: 'park',
    layers: ['vehicles-point']
  },
  {
    id: 'park-clusters',
    name: 'Clusters',
    description: 'Toon voertuigen gegroepeerd in clusters',
    category: 'park',
    layers: ['vehicles-clusters', 'vehicles-clusters-count', 'vehicles-clusters-point']
  },
  {
    id: 'park-heatmap',
    name: 'Heat map',
    description: 'Toon voertuigdichtheid als heatmap',
    category: 'park',
    layers: ['vehicles-heatmap']
  },

  // Rentals mode presets - Origins
  {
    id: 'rentals-origins-points',
    name: 'Herkomst voertuigen',
    description: 'Toon startpunten van verhuringen',
    category: 'rentals',
    layers: ['rentals-origins-point']
  },
  {
    id: 'rentals-origins-clusters',
    name: 'Herkomst clusters',
    description: 'Toon herkomstpunten gegroepeerd',
    category: 'rentals',
    layers: ['rentals-origins-clusters', 'rentals-origins-clusters-count', 'rentals-origins-clusters-point']
  },
  {
    id: 'rentals-origins-heatmap',
    name: 'Herkomst heat map',
    description: 'Toon herkomstdichtheid als heatmap',
    category: 'rentals',
    layers: ['rentals-origins-heatmap']
  },

  // Rentals mode presets - Destinations
  {
    id: 'rentals-destinations-points',
    name: 'Bestemming voertuigen',
    description: 'Toon eindpunten van verhuringen',
    category: 'rentals',
    layers: ['rentals-destinations-point']
  },
  {
    id: 'rentals-destinations-clusters',
    name: 'Bestemming clusters',
    description: 'Toon bestemmingspunten gegroepeerd',
    category: 'rentals',
    layers: ['rentals-destinations-clusters', 'rentals-destinations-clusters-count', 'rentals-destinations-clusters-point']
  },
  {
    id: 'rentals-destinations-heatmap',
    name: 'Bestemming heat map',
    description: 'Toon bestemmingsdichtheid als heatmap',
    category: 'rentals',
    layers: ['rentals-destinations-heatmap']
  },

  // Zones mode preset
  {
    id: 'zones-public',
    name: 'Zone metrics',
    description: 'Toon publieke zone metrics',
    category: 'zones',
    layers: ['zones-metrics-public', 'zones-metrics-public-border']
  },

  // Policy hubs mode preset
  {
    id: 'policy-hubs',
    name: 'Beleidshubs',
    description: 'Toon beleidshubs',
    category: 'policy-hubs',
    layers: ['satellite'] // Uses satellite as base layer
  }
];

export const layerConfig: LayerManagerConfig = {
  layers,
  presets
};

// Helper functions
export const getLayersByCategory = (category: string): LayerConfig[] => {
  return Object.values(layers).filter(layer => layer.category === category);
};

export const getPresetsByCategory = (category: string): LayerPreset[] => {
  return presets.filter(preset => preset.category === category);
};

export const getLayerById = (id: string): LayerConfig | undefined => {
  return layers[id];
};

export const getPresetById = (id: string): LayerPreset | undefined => {
  return presets.find(preset => preset.id === id);
};

// Map old display modes to new presets
export const displayModeToPresetMap: Record<string, string> = {
  'displaymode-park': 'park-points',
  'displaymode-rentals': 'rentals-origins-points',
  'displaymode-zones-public': 'zones-public',
  'displaymode-policy-hubs': 'policy-hubs'
};

export const viewModeToPresetMap: Record<string, Record<string, string>> = {
  'park': {
    'parkeerdata-voertuigen': 'park-points',
    'parkeerdata-clusters': 'park-clusters',
    'parkeerdata-heatmap': 'park-heatmap'
  },
  'rentals': {
    'verhuurdata-voertuigen': 'rentals-origins-points',
    'verhuurdata-clusters': 'rentals-origins-clusters',
    'verhuurdata-heatmap': 'rentals-origins-heatmap'
  }
}; 