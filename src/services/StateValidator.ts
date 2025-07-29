import { ValidationIssue, ValidationResult, FixOperation, FixResult, LayerConfig, SourceConfig } from '../types/LayerTypes';

/**
 * Validate and fix inconsistent layer states
 */
export class LayerStateValidator {
  private map: any;
  private layerRegistry: any; // Will be injected by LayerService

  constructor(map?: any, layerRegistry?: any) {
    this.map = map;
    this.layerRegistry = layerRegistry;
  }

  /**
   * Set map instance
   */
  setMap(map: any): void {
    this.map = map;
  }

  /**
   * Set layer registry
   */
  setLayerRegistry(layerRegistry: any): void {
    this.layerRegistry = layerRegistry;
  }

  /**
   * Validate current map state
   */
  async validateMapState(): Promise<ValidationResult> {
    if (!this.map) {
          return {
      valid: false,
      issues: [{
        type: 'MISSING_LAYER',
        severity: 'ERROR',
        message: 'Map instance not available'
      }],
      canAutoFix: false
    };
    }

    const issues: ValidationIssue[] = [];

    // Check for orphaned layers (layers without sources)
    const orphanedLayers = this.findOrphanedLayers();
    issues.push(...orphanedLayers.map(layer => ({
      type: 'ORPHANED_LAYER' as const,
      layerId: layer,
      severity: 'ERROR' as const,
      message: `Layer '${layer}' exists on map but its source is missing`
    })));

    // Check for missing layers (should exist but don't)
    const missingLayers = this.findMissingLayers();
    issues.push(...missingLayers.map(layer => ({
      type: 'MISSING_LAYER' as const,
      layerId: layer,
      severity: 'WARNING' as const,
      message: `Layer '${layer}' should exist on map but doesn't`
    })));

    // Check for inconsistent visibility
    const visibilityIssues = this.findVisibilityInconsistencies();
    issues.push(...visibilityIssues);

    // Check for missing sources
    const missingSources = this.findMissingSources();
    issues.push(...missingSources.map(source => ({
      type: 'MISSING_SOURCE' as const,
      sourceId: source,
      severity: 'ERROR' as const,
      message: `Source '${source}' is required but missing`
    })));

    return {
      valid: issues.length === 0,
      issues,
      canAutoFix: this.canAutoFix(issues)
    };
  }

  /**
   * Find layers that exist on map but have missing sources
   */
  private findOrphanedLayers(): string[] {
    if (!this.map || !this.map.getStyle) {
      return [];
    }

    const orphaned: string[] = [];
    const style = this.map.getStyle();
    
    if (!style || !style.layers) {
      return orphaned;
    }

    for (const layer of style.layers) {
      if (layer.source && !this.map.getSource(layer.source)) {
        orphaned.push(layer.id);
      }
    }

    return orphaned;
  }

  /**
   * Find layers that should exist but don't
   */
  private findMissingLayers(): string[] {
    if (!this.layerRegistry) {
      return [];
    }

    const missing: string[] = [];
    const allLayers = this.layerRegistry.getAllLayers();

    for (const [layerId, layerConfig] of allLayers) {
      if (layerConfig.visible && !this.map.getLayer(layerId)) {
        missing.push(layerId);
      }
    }

    return missing;
  }

  /**
   * Find visibility inconsistencies
   */
  private findVisibilityInconsistencies(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!this.layerRegistry) {
      return issues;
    }

    const allLayers = this.layerRegistry.getAllLayers();

    for (const [layerId, layerConfig] of allLayers) {
      const mapLayer = this.map.getLayer(layerId);
      
      if (mapLayer) {
        const mapVisibility = this.map.getLayoutProperty(layerId, 'visibility');
        const expectedVisibility = layerConfig.visible ? 'visible' : 'none';
        
        if (mapVisibility !== expectedVisibility) {
          issues.push({
            type: 'INCONSISTENT_VISIBILITY',
            layerId,
            severity: 'WARNING',
            message: `Layer '${layerId}' visibility mismatch: expected ${expectedVisibility}, got ${mapVisibility}`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Find missing sources
   */
  private findMissingSources(): string[] {
    if (!this.layerRegistry) {
      return [];
    }

    const missing: string[] = [];
    const allLayers = this.layerRegistry.getAllLayers();

    for (const [layerId, layerConfig] of allLayers) {
      if (layerConfig.source && !this.map.getSource(layerConfig.source)) {
        missing.push(layerConfig.source);
      }
    }

    return Array.from(new Set(missing)); // Remove duplicates
  }

  /**
   * Check if issues can be auto-fixed
   */
  private canAutoFix(issues: ValidationIssue[]): boolean {
    return issues.some(issue => 
      issue.severity === 'ERROR' && 
      (issue.type === 'MISSING_LAYER' || issue.type === 'MISSING_SOURCE')
    );
  }

  /**
   * Auto-fix validation issues
   */
  async autoFix(issues: ValidationIssue[]): Promise<FixResult> {
    const fixes: FixOperation[] = [];
    const errors: string[] = [];

    for (const issue of issues) {
      if (issue.severity === 'ERROR') {
        const fix = this.createFixForIssue(issue);
        if (fix) {
          fixes.push(fix);
        } else {
          errors.push(`Cannot create fix for issue: ${issue.message}`);
        }
      }
    }

    return this.executeFixes(fixes);
  }

  /**
   * Create fix operation for an issue
   */
  private createFixForIssue(issue: ValidationIssue): FixOperation | null {
    switch (issue.type) {
      case 'MISSING_LAYER':
        return this.createAddLayerFix(issue.layerId!);
      
      case 'MISSING_SOURCE':
        return this.createAddSourceFix(issue.sourceId!);
      
      case 'ORPHANED_LAYER':
        return this.createRemoveLayerFix(issue.layerId!);
      
      case 'INCONSISTENT_VISIBILITY':
        return this.createSetVisibilityFix(issue.layerId!);
      
      default:
        return null;
    }
  }

  /**
   * Create fix to add missing layer
   */
  private createAddLayerFix(layerId: string): FixOperation | null {
    if (!this.layerRegistry) {
      return null;
    }

    const layerConfig = this.layerRegistry.getLayer(layerId);
    if (!layerConfig) {
      return null;
    }

    return {
      type: 'ADD_LAYER',
      layerId,
      config: layerConfig
    };
  }

  /**
   * Create fix to add missing source
   */
  private createAddSourceFix(sourceId: string): FixOperation | null {
    if (!this.layerRegistry) {
      return null;
    }

    const sourceConfig = this.layerRegistry.getSource(sourceId);
    if (!sourceConfig) {
      return null;
    }

    return {
      type: 'ADD_SOURCE',
      sourceId,
      config: sourceConfig
    };
  }

  /**
   * Create fix to remove orphaned layer
   */
  private createRemoveLayerFix(layerId: string): FixOperation {
    return {
      type: 'REMOVE_LAYER',
      layerId
    };
  }

  /**
   * Create fix to set layer visibility
   */
  private createSetVisibilityFix(layerId: string): FixOperation | null {
    if (!this.layerRegistry) {
      return null;
    }

    const layerConfig = this.layerRegistry.getLayer(layerId);
    if (!layerConfig) {
      return null;
    }

    return {
      type: 'SET_VISIBILITY',
      layerId,
      visible: layerConfig.visible
    };
  }

  /**
   * Execute fix operations
   */
  private async executeFixes(fixes: FixOperation[]): Promise<FixResult> {
    const errors: string[] = [];

    for (const fix of fixes) {
      try {
        await this.executeFix(fix);
      } catch (error) {
        errors.push(`Failed to execute fix ${fix.type} for ${fix.layerId || fix.sourceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      fixes,
      errors
    };
  }

  /**
   * Execute a single fix operation
   */
  private async executeFix(fix: FixOperation): Promise<void> {
    if (!this.map) {
      throw new Error('Map not available for fix execution');
    }

    switch (fix.type) {
      case 'ADD_LAYER':
        await this.addLayer(fix.layerId!, fix.config as LayerConfig);
        break;
      
      case 'ADD_SOURCE':
        await this.addSource(fix.sourceId!, fix.config as SourceConfig);
        break;
      
      case 'REMOVE_LAYER':
        await this.removeLayer(fix.layerId!);
        break;
      
      case 'SET_VISIBILITY':
        await this.setVisibility(fix.layerId!, fix.visible!);
        break;
      
      default:
        throw new Error(`Unknown fix type: ${(fix as any).type}`);
    }
  }

  /**
   * Add layer to map
   */
  private async addLayer(layerId: string, config: LayerConfig): Promise<void> {
    // This will be implemented by the LayerService
    console.log(`Would add layer: ${layerId}`);
  }

  /**
   * Add source to map
   */
  private async addSource(sourceId: string, config: SourceConfig): Promise<void> {
    // This will be implemented by the LayerService
    console.log(`Would add source: ${sourceId}`);
  }

  /**
   * Remove layer from map
   */
  private async removeLayer(layerId: string): Promise<void> {
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
  }

  /**
   * Set layer visibility
   */
  private async setVisibility(layerId: string, visible: boolean): Promise<void> {
    if (this.map.getLayer(layerId)) {
      const visibility = visible ? 'visible' : 'none';
      this.map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(issues: ValidationIssue[]): {
    total: number;
    errors: number;
    warnings: number;
    autoFixable: number;
  } {
    const errors = issues.filter(issue => issue.severity === 'ERROR').length;
    const warnings = issues.filter(issue => issue.severity === 'WARNING').length;
    const autoFixable = issues.filter(issue => 
      issue.severity === 'ERROR' && 
      (issue.type === 'MISSING_LAYER' || issue.type === 'MISSING_SOURCE')
    ).length;

    return {
      total: issues.length,
      errors,
      warnings,
      autoFixable
    };
  }
} 