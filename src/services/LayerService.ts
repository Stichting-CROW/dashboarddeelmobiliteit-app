import { 
  LayerConfig, 
  SourceConfig, 
  LayerOperation, 
  LayerOperationResult, 
  LayerVisibilityOperation, 
  BatchResult,
  LayerState,
  LayerOperationOptions
} from '../types/LayerTypes';
import { LayerRegistry } from './LayerRegistry';
import { OperationQueue } from './OperationQueue';
import { LayerErrorHandler } from './ErrorHandler';
import { LayerStateValidator } from './StateValidator';
import { LayerPerformanceMonitor } from './PerformanceMonitor';

/**
 * Centralized layer management service
 */
export class LayerService {
  private layerRegistry: LayerRegistry;
  private operationQueue: OperationQueue;
  private errorHandler: LayerErrorHandler;
  private stateValidator: LayerStateValidator;
  private performanceMonitor: LayerPerformanceMonitor;
  private map: any;
  private currentState: LayerState;

  constructor() {
    this.layerRegistry = new LayerRegistry();
    this.operationQueue = new OperationQueue();
    this.errorHandler = new LayerErrorHandler();
    this.stateValidator = new LayerStateValidator();
    this.performanceMonitor = new LayerPerformanceMonitor();
    this.currentState = this.getInitialState();
  }

  /**
   * Initialize the service with map instance
   */
  initialize(map: any): void {
    this.map = map;
    this.stateValidator.setMap(map);
    this.stateValidator.setLayerRegistry(this.layerRegistry);
    this.operationQueue.setMapReady(!!map && map.isStyleLoaded());
  }

  /**
   * Register layers and sources from configuration
   */
  registerFromConfig(layers: Record<string, LayerConfig>, sources: Record<string, SourceConfig>): void {
    // Register sources first (layers depend on them)
    const sourceConfigs = Object.values(sources);
    this.layerRegistry.registerSources(sourceConfigs);

    // Register layers
    const layerConfigs = Object.values(layers);
    this.layerRegistry.registerLayers(layerConfigs);

    console.log(`Registered ${layerConfigs.length} layers and ${sourceConfigs.length} sources`);
  }

  /**
   * Set layer visibility
   */
  async setLayerVisibility(layerId: string, visible: boolean, options: LayerOperationOptions = {}): Promise<LayerOperationResult> {
    const operationId = this.performanceMonitor.startOperation('setVisibility', layerId);

    try {
      // Validate layer exists
      const layer = this.layerRegistry.getLayer(layerId);
      if (!layer) {
        const error = this.errorHandler.createError('LAYER_NOT_FOUND', `Layer ${layerId} not found`, layerId);
        return await this.errorHandler.handleError(error, { type: 'show', layerId });
      }

      // Check dependencies
      const dependencyCheck = await this.checkDependencies(layer, visible);
      if (!dependencyCheck.success) {
        return dependencyCheck;
      }

      // Queue operation
      const result = await this.operationQueue.enqueue({
        type: visible ? 'show' : 'hide',
        layerId,
        options
      });

      // Update state
      if (result.success) {
        this.updateLayerVisibility(layerId, visible);
      }

      this.performanceMonitor.endOperation(operationId, result.success, result.error);
      return result;

    } catch (error) {
      this.performanceMonitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Batch set layer visibility
   */
  async batchSetLayerVisibility(operations: LayerVisibilityOperation[], options: LayerOperationOptions = {}): Promise<BatchResult> {
    const operationId = this.performanceMonitor.startOperation('batchSetVisibility', 'batch');

    try {
      const results: LayerOperationResult[] = [];

      // Group operations by type for efficiency
      const showOperations = operations.filter(op => op.visible);
      const hideOperations = operations.filter(op => !op.visible);

      // Disable map interactions during batch operation if using ultra-fast mode
      if (options.useUltraFast) {
        this.disableMapInteractions();
      }

      try {
        // Execute show operations
        const showResults = await Promise.all(showOperations.map(op => 
          this.setLayerVisibility(op.layerId, true, op.options)
        ));
        results.push(...showResults);

        // Execute hide operations
        const hideResults = await Promise.all(hideOperations.map(op => 
          this.setLayerVisibility(op.layerId, false, op.options)
        ));
        results.push(...hideResults);

      } finally {
        // Re-enable map interactions
        if (options.useUltraFast) {
          this.enableMapInteractions();
        }
      }

      const summary = this.aggregateBatchResults(results);
      this.performanceMonitor.endOperation(operationId, summary.success);
      
      return summary;

    } catch (error) {
      this.performanceMonitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Add layer to map
   */
  async addLayer(layerId: string, options: LayerOperationOptions = {}): Promise<LayerOperationResult> {
    const operationId = this.performanceMonitor.startOperation('addLayer', layerId);

    try {
      const layer = this.layerRegistry.getLayer(layerId);
      if (!layer) {
        const error = this.errorHandler.createError('LAYER_NOT_FOUND', `Layer ${layerId} not found`, layerId);
        return await this.errorHandler.handleError(error, { type: 'add', layerId });
      }

      // Check if layer already exists
      if (this.map.getLayer(layerId)) {
        return {
          success: true,
          layerId,
          warnings: ['Layer already exists on map']
        };
      }

      // Ensure source exists
      if (layer.source) {
        const sourceExists = this.map.getSource(layer.source);
        if (!sourceExists) {
          const source = this.layerRegistry.getSource(layer.source);
          if (source) {
            await this.addSource(layer.source, source);
          }
        }
      }

      // Add layer to map
      const layerDefinition = this.createLayerDefinition(layer);
      this.map.addLayer(layerDefinition);

      this.performanceMonitor.endOperation(operationId, true);
      return { success: true, layerId };

    } catch (error) {
      this.performanceMonitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      const layerError = this.errorHandler.convertError(error, layerId);
      return await this.errorHandler.handleError(layerError, { type: 'add', layerId });
    }
  }

  /**
   * Add source to map
   */
  async addSource(sourceId: string, sourceConfig: SourceConfig): Promise<LayerOperationResult> {
    const operationId = this.performanceMonitor.startOperation('addSource', sourceId);

    try {
      // Check if source already exists
      if (this.map.getSource(sourceId)) {
        return {
          success: true,
          layerId: sourceId,
          warnings: ['Source already exists on map']
        };
      }

      // Add source to map
      const mapSourceConfig = this.createSourceConfig(sourceConfig);
      this.map.addSource(sourceId, mapSourceConfig);

      this.performanceMonitor.endOperation(operationId, true);
      return { success: true, layerId: sourceId };

    } catch (error) {
      this.performanceMonitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      const sourceError = this.errorHandler.convertError(error, sourceId);
      return await this.errorHandler.handleError(sourceError, { type: 'add', layerId: sourceId });
    }
  }

  /**
   * Remove layer from map
   */
  async removeLayer(layerId: string): Promise<LayerOperationResult> {
    const operationId = this.performanceMonitor.startOperation('removeLayer', layerId);

    try {
      if (!this.map.getLayer(layerId)) {
        return {
          success: true,
          layerId,
          warnings: ['Layer does not exist on map']
        };
      }

      this.map.removeLayer(layerId);
      this.updateLayerVisibility(layerId, false);

      this.performanceMonitor.endOperation(operationId, true);
      return { success: true, layerId };

    } catch (error) {
      this.performanceMonitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      const layerError = this.errorHandler.convertError(error, layerId);
      return await this.errorHandler.handleError(layerError, { type: 'remove', layerId });
    }
  }

  /**
   * Get current layer state
   */
  getCurrentState(): LayerState {
    return { ...this.currentState };
  }

  /**
   * Validate current map state
   */
  async validateState(): Promise<any> {
    return await this.stateValidator.validateMapState();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    return this.performanceMonitor.getStats();
  }

  /**
   * Get layer registry
   */
  getLayerRegistry(): LayerRegistry {
    return this.layerRegistry;
  }

  /**
   * Get operation queue status
   */
  getQueueStatus(): any {
    return this.operationQueue.getStatus();
  }

  // Private helper methods

  private getInitialState(): LayerState {
    return {
      visibleLayers: [],
      hiddenLayers: [],
      activeSources: [],
      baseLayer: 'base',
      zonesVisible: false,
      displayMode: 'park',
      parkView: 'points',
      rentalsView: 'points'
    };
  }

  private async checkDependencies(layer: LayerConfig, visible: boolean): Promise<LayerOperationResult> {
    if (!visible) {
      return { success: true, layerId: layer.id };
    }

    // Check required sources
    if (layer.source) {
      const source = this.map.getSource(layer.source);
      if (!source) {
        const sourceConfig = this.layerRegistry.getSource(layer.source);
        if (sourceConfig) {
          await this.addSource(layer.source, sourceConfig);
        } else {
          return {
            success: false,
            layerId: layer.id,
            error: `Required source ${layer.source} not found`
          };
        }
      }
    }

    // Check layer dependencies
    if (layer.dependencies) {
      for (const depId of layer.dependencies) {
        const depLayer = this.map.getLayer(depId);
        if (!depLayer) {
          const depConfig = this.layerRegistry.getLayer(depId);
          if (depConfig) {
            await this.addLayer(depId);
          } else {
            return {
              success: false,
              layerId: layer.id,
              error: `Required dependency ${depId} not found`
            };
          }
        }
      }
    }

    return { success: true, layerId: layer.id };
  }

  private updateLayerVisibility(layerId: string, visible: boolean): void {
    if (visible) {
      if (!this.currentState.visibleLayers.includes(layerId)) {
        this.currentState.visibleLayers.push(layerId);
      }
      this.currentState.hiddenLayers = this.currentState.hiddenLayers.filter(id => id !== layerId);
    } else {
      if (!this.currentState.hiddenLayers.includes(layerId)) {
        this.currentState.hiddenLayers.push(layerId);
      }
      this.currentState.visibleLayers = this.currentState.visibleLayers.filter(id => id !== layerId);
    }
  }

  private aggregateBatchResults(results: LayerOperationResult[]): BatchResult {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const warnings = results.flatMap(r => r.warnings || []);

    return {
      success: failed.length === 0,
      results,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        warnings: warnings.length
      }
    };
  }

  private createLayerDefinition(layer: LayerConfig): any {
    // This is a simplified version - in practice, you'd need to convert from LayerConfig to MapLibre layer definition
    return {
      id: layer.id,
      type: 'circle', // Default type - should be determined from layer config
      source: layer.source,
      layout: {
        visibility: layer.visible ? 'visible' : 'none'
      }
    };
  }

  private createSourceConfig(source: SourceConfig): any {
    // Convert SourceConfig to MapLibre source configuration
    const config: any = {
      type: source.type
    };

    if (source.data) {
      config.data = source.data;
    }

    if (source.url) {
      config.url = source.url;
    }

    if (source.tiles) {
      config.tiles = source.tiles;
    }

    if (source.cluster) {
      config.cluster = source.cluster;
      if (source.clusterRadius) config.clusterRadius = source.clusterRadius;
      if (source.clusterMaxZoom) config.clusterMaxZoom = source.clusterMaxZoom;
    }

    return config;
  }

  private disableMapInteractions(): void {
    if (this.map && this.map.dragPan) {
      this.map.dragPan.disable();
    }
    if (this.map && this.map.scrollZoom) {
      this.map.scrollZoom.disable();
    }
  }

  private enableMapInteractions(): void {
    if (this.map && this.map.dragPan) {
      this.map.dragPan.enable();
    }
    if (this.map && this.map.scrollZoom) {
      this.map.scrollZoom.enable();
    }
  }
} 