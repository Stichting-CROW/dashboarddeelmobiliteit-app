import { LayerConfig, SourceConfig, LayerRegistryConfig, ValidationIssue } from '../types/LayerTypes';

/**
 * Centralized layer registry with validation and dependency management
 */
export class LayerRegistry {
  private layers: Map<string, LayerConfig> = new Map();
  private sources: Map<string, SourceConfig> = new Map();
  private config: LayerRegistryConfig;

  constructor(config: LayerRegistryConfig = {}) {
    this.config = {
      validateOnRegistration: true,
      allowDuplicateIds: false,
      strictMode: true,
      ...config
    };
  }

  /**
   * Register a layer with validation
   */
  registerLayer(config: LayerConfig): void {
    if (this.layers.has(config.id) && !this.config.allowDuplicateIds) {
      throw new Error(`Layer with id '${config.id}' already exists`);
    }

    if (this.config.validateOnRegistration) {
      this.validateLayer(config);
    }

    this.layers.set(config.id, config);
  }

  /**
   * Register multiple layers at once
   */
  registerLayers(configs: LayerConfig[]): void {
    for (const config of configs) {
      this.registerLayer(config);
    }
  }

  /**
   * Register a source with validation
   */
  registerSource(config: SourceConfig): void {
    if (this.sources.has(config.id) && !this.config.allowDuplicateIds) {
      throw new Error(`Source with id '${config.id}' already exists`);
    }

    if (this.config.validateOnRegistration) {
      this.validateSource(config);
    }

    this.sources.set(config.id, config);
  }

  /**
   * Register multiple sources at once
   */
  registerSources(configs: SourceConfig[]): void {
    for (const config of configs) {
      this.registerSource(config);
    }
  }

  /**
   * Get a layer by ID
   */
  getLayer(layerId: string): LayerConfig | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get a source by ID
   */
  getSource(sourceId: string): SourceConfig | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get all layers
   */
  getAllLayers(): Map<string, LayerConfig> {
    return new Map(this.layers);
  }

  /**
   * Get all sources
   */
  getAllSources(): Map<string, SourceConfig> {
    return new Map(this.sources);
  }

  /**
   * Get layers by category
   */
  getLayersByCategory(category: string): LayerConfig[] {
    return Array.from(this.layers.values()).filter(layer => layer.category === category);
  }

  /**
   * Get sources by type
   */
  getSourcesByType(type: string): SourceConfig[] {
    return Array.from(this.sources.values()).filter(source => source.type === type);
  }

  /**
   * Check if layer exists
   */
  hasLayer(layerId: string): boolean {
    return this.layers.has(layerId);
  }

  /**
   * Check if source exists
   */
  hasSource(sourceId: string): boolean {
    return this.sources.has(sourceId);
  }

  /**
   * Get layers that depend on a specific source
   */
  getLayersBySource(sourceId: string): LayerConfig[] {
    return Array.from(this.layers.values()).filter(layer => layer.source === sourceId);
  }

  /**
   * Get layers that depend on a specific layer
   */
  getDependentLayers(layerId: string): LayerConfig[] {
    return Array.from(this.layers.values()).filter(layer => 
      layer.dependencies && layer.dependencies.includes(layerId)
    );
  }

  /**
   * Validate layer configuration
   */
  private validateLayer(config: LayerConfig): void {
    const issues: ValidationIssue[] = [];

    // Check required fields
    if (!config.id) {
      issues.push({
        type: 'INVALID_DEPENDENCY',
        layerId: config.id,
        severity: 'ERROR',
        message: 'Layer ID is required'
      });
    }

    if (!config.name) {
      issues.push({
        type: 'INVALID_DEPENDENCY',
        layerId: config.id,
        severity: 'ERROR',
        message: 'Layer name is required'
      });
    }

    // Check source dependency
    if (config.source && !this.sources.has(config.source)) {
      issues.push({
        type: 'MISSING_SOURCE',
        layerId: config.id,
        sourceId: config.source,
        severity: 'ERROR',
        message: `Layer '${config.id}' references non-existent source '${config.source}'`
      });
    }

    // Check layer dependencies
    if (config.dependencies) {
      for (const depId of config.dependencies) {
        if (!this.layers.has(depId)) {
          issues.push({
            type: 'INVALID_DEPENDENCY',
            layerId: config.id,
            severity: 'ERROR',
            message: `Layer '${config.id}' depends on non-existent layer '${depId}'`
          });
        }
      }
    }

    // Check required sources
    if (config.requiredSources) {
      for (const sourceId of config.requiredSources) {
        if (!this.sources.has(sourceId)) {
          issues.push({
            type: 'MISSING_SOURCE',
            layerId: config.id,
            sourceId,
            severity: 'ERROR',
            message: `Layer '${config.id}' requires non-existent source '${sourceId}'`
          });
        }
      }
    }

    if (issues.length > 0) {
      const errorMessages = issues.map(issue => issue.message).join('; ');
      throw new Error(`Layer validation failed: ${errorMessages}`);
    }
  }

  /**
   * Validate source configuration
   */
  private validateSource(config: SourceConfig): void {
    const issues: ValidationIssue[] = [];

    // Check required fields
    if (!config.id) {
      issues.push({
        type: 'MISSING_SOURCE',
        sourceId: config.id,
        severity: 'ERROR',
        message: 'Source ID is required'
      });
    }

    if (!config.type) {
      issues.push({
        type: 'MISSING_SOURCE',
        sourceId: config.id,
        severity: 'ERROR',
        message: 'Source type is required'
      });
    }

    // Validate source type specific requirements
    switch (config.type) {
      case 'geojson':
        if (!config.data && !config.url) {
          issues.push({
            type: 'MISSING_SOURCE',
            sourceId: config.id,
            severity: 'ERROR',
            message: 'GeoJSON source requires either data or url'
          });
        }
        break;
      case 'raster':
        if (!config.url && !config.tiles) {
          issues.push({
            type: 'MISSING_SOURCE',
            sourceId: config.id,
            severity: 'ERROR',
            message: 'Raster source requires either url or tiles'
          });
        }
        break;
      case 'vector':
        if (!config.url && !config.tiles) {
          issues.push({
            type: 'MISSING_SOURCE',
            sourceId: config.id,
            severity: 'ERROR',
            message: 'Vector source requires either url or tiles'
          });
        }
        break;
    }

    if (issues.length > 0) {
      const errorMessages = issues.map(issue => issue.message).join('; ');
      throw new Error(`Source validation failed: ${errorMessages}`);
    }
  }

  /**
   * Validate all registered layers and sources
   */
  validateAll(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate all layers
    for (const layer of Array.from(this.layers.values())) {
      try {
        this.validateLayer(layer);
      } catch (error) {
        issues.push({
          type: 'INVALID_DEPENDENCY',
          layerId: layer.id,
          severity: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        });
      }
    }

    // Validate all sources
    for (const source of Array.from(this.sources.values())) {
      try {
        this.validateSource(source);
      } catch (error) {
        issues.push({
          type: 'MISSING_SOURCE',
          sourceId: source.id,
          severity: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        });
      }
    }

    return issues;
  }

  /**
   * Clear all registered layers and sources
   */
  clear(): void {
    this.layers.clear();
    this.sources.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    layerCount: number;
    sourceCount: number;
    categories: string[];
    sourceTypes: string[];
  } {
    const categories = new Set(Array.from(this.layers.values()).map(layer => layer.category));
    const sourceTypes = new Set(Array.from(this.sources.values()).map(source => source.type));

    return {
      layerCount: this.layers.size,
      sourceCount: this.sources.size,
      categories: Array.from(categories),
      sourceTypes: Array.from(sourceTypes)
    };
  }
} 