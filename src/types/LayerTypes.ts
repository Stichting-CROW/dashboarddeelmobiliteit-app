// Enhanced type definitions for the new layer management system

export interface LayerConfig {
  id: string;
  name: string;
  type: 'background' | 'data' | 'overlay';
  category: string;
  source?: string;
  dependencies?: string[]; // Other layers this depends on
  requiredSources?: string[]; // Sources that must exist
  validation?: {
    minZoom?: number;
    maxZoom?: number;
    requiredData?: string[];
  };
  visible: boolean;
  order: number;
  description?: string;
  icon?: string;
  isBackgroundLayer?: boolean;
}

export interface SourceConfig {
  id: string;
  type: 'geojson' | 'raster' | 'vector' | 'image';
  data?: any;
  url?: string;
  tiles?: string[];
  cluster?: boolean;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  attribution?: string;
  tileSize?: number;
}

export interface LayerPreset {
  id: string;
  name: string;
  description: string;
  layers: string[];
  category: 'park' | 'rentals' | 'zones' | 'policy-hubs' | 'base';
}

export interface LayerOperation {
  type: 'show' | 'hide' | 'add' | 'remove' | 'update';
  layerId: string;
  options?: {
    skipAnimation?: boolean;
    preserveOrder?: boolean;
    validateDependencies?: boolean;
    useUltraFast?: boolean;
  };
}

export interface LayerOperationResult {
  success: boolean;
  layerId: string;
  error?: string;
  warnings?: string[];
  critical?: boolean;
  canRetry?: boolean;
}

export interface LayerVisibilityOperation {
  layerId: string;
  visible: boolean;
  options?: LayerOperation['options'];
}

export interface BatchResult {
  success: boolean;
  results: LayerOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    warnings: number;
  };
}

export interface QueuedOperation {
  id: string;
  operation: LayerOperation;
  timestamp: number;
  retryCount: number;
  priority?: number;
}

export interface LayerError {
  type: 'LAYER_NOT_FOUND' | 'SOURCE_NOT_FOUND' | 'DEPENDENCY_MISSING' | 'MAP_NOT_READY' | 'OPERATION_TIMEOUT' | 'INVALID_STATE';
  message: string;
  layerId?: string;
  sourceId?: string;
  context?: any;
}

export interface RecoveryStrategy {
  canRecover: boolean;
  canRetry: boolean;
  strategy: 'ADD_MISSING_LAYER' | 'ADD_MISSING_SOURCE' | 'RETRY_AFTER_DELAY' | 'FAIL';
  delay?: number;
}

export interface ValidationIssue {
  type: 'ORPHANED_LAYER' | 'MISSING_LAYER' | 'INCONSISTENT_VISIBILITY' | 'MISSING_SOURCE' | 'INVALID_DEPENDENCY';
  layerId?: string;
  sourceId?: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  canAutoFix: boolean;
}

export interface FixOperation {
  type: 'ADD_LAYER' | 'REMOVE_LAYER' | 'ADD_SOURCE' | 'REMOVE_SOURCE' | 'SET_VISIBILITY';
  layerId?: string;
  sourceId?: string;
  visible?: boolean;
  config?: LayerConfig | SourceConfig;
}

export interface FixResult {
  success: boolean;
  fixes: FixOperation[];
  errors: string[];
}

export interface OperationMetrics {
  operationType: string;
  layerId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  error?: string;
}

export interface LayerState {
  visibleLayers: string[];
  hiddenLayers: string[];
  activeSources: string[];
  baseLayer: 'base' | 'satellite' | 'hybrid';
  zonesVisible: boolean;
  displayMode: string;
  parkView: string;
  rentalsView: string;
}

export interface LayerOperationOptions {
  skipAnimation?: boolean;
  preserveOrder?: boolean;
  validateDependencies?: boolean;
  useUltraFast?: boolean;
  batch?: boolean;
}

export interface LayerRegistryConfig {
  validateOnRegistration?: boolean;
  allowDuplicateIds?: boolean;
  strictMode?: boolean;
}

export interface OperationQueueConfig {
  maxRetries?: number;
  retryDelay?: number;
  maxQueueSize?: number;
  timeout?: number;
}

export interface PerformanceConfig {
  slowOperationThreshold?: number;
  enableMetrics?: boolean;
  logSlowOperations?: boolean;
} 