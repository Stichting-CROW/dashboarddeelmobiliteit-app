import { OperationMetrics, PerformanceConfig } from '../types/LayerTypes';

/**
 * Monitor layer operation performance
 */
export class LayerPerformanceMonitor {
  private metrics: Map<string, OperationMetrics> = new Map();
  private config: PerformanceConfig;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      slowOperationThreshold: 100,
      enableMetrics: true,
      logSlowOperations: true,
      ...config
    };
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operationType: string, layerId: string): string {
    if (!this.config.enableMetrics) {
      return '';
    }

    const operationId = this.generateId();
    const startTime = performance.now();
    
    this.metrics.set(operationId, {
      operationType,
      layerId,
      startTime,
      status: 'RUNNING'
    });
    
    return operationId;
  }

  /**
   * End monitoring an operation
   */
  endOperation(operationId: string, success: boolean, error?: string): void {
    if (!this.config.enableMetrics || !operationId) {
      return;
    }

    const metric = this.metrics.get(operationId);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = success ? 'SUCCESS' : 'FAILED';
      metric.error = error;
      
      // Log slow operations
      if (this.config.logSlowOperations && metric.duration > this.config.slowOperationThreshold!) {
        console.warn(`Slow layer operation: ${metric.operationType} for ${metric.layerId} took ${metric.duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    slowOperations: number;
    operationTypes: Record<string, number>;
  } {
    const operations = Array.from(this.metrics.values());
    const completedOperations = operations.filter(op => op.status !== 'RUNNING');
    
    const successful = completedOperations.filter(op => op.status === 'SUCCESS');
    const failed = completedOperations.filter(op => op.status === 'FAILED');
    const slow = completedOperations.filter(op => 
      op.duration && op.duration > this.config.slowOperationThreshold!
    );

    const totalDuration = completedOperations.reduce((sum, op) => 
      sum + (op.duration || 0), 0
    );
    const averageDuration = completedOperations.length > 0 
      ? totalDuration / completedOperations.length 
      : 0;

    const operationTypes: Record<string, number> = {};
    completedOperations.forEach(op => {
      operationTypes[op.operationType] = (operationTypes[op.operationType] || 0) + 1;
    });

    return {
      totalOperations: completedOperations.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration,
      slowOperations: slow.length,
      operationTypes
    };
  }

  /**
   * Get metrics for a specific layer
   */
  getLayerMetrics(layerId: string): OperationMetrics[] {
    return Array.from(this.metrics.values()).filter(metric => metric.layerId === layerId);
  }

  /**
   * Get metrics for a specific operation type
   */
  getOperationTypeMetrics(operationType: string): OperationMetrics[] {
    return Array.from(this.metrics.values()).filter(metric => metric.operationType === operationType);
  }

  /**
   * Get slow operations
   */
  getSlowOperations(): OperationMetrics[] {
    return Array.from(this.metrics.values()).filter(metric => 
      metric.duration && metric.duration > this.config.slowOperationThreshold!
    );
  }

  /**
   * Clear old metrics (keep only recent ones)
   */
  clearOldMetrics(maxAgeMs: number = 300000): void { // 5 minutes default
    const cutoff = Date.now() - maxAgeMs;
    const toDelete: string[] = [];

    for (const [id, metric] of Array.from(this.metrics)) {
      if (metric.startTime < cutoff) {
        toDelete.push(id);
      }
    }

    toDelete.forEach(id => this.metrics.delete(id));
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Generate unique operation ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): OperationMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): string {
    const stats = this.getStats();
    const slowOps = this.getSlowOperations();
    
    return `
Performance Summary:
- Total Operations: ${stats.totalOperations}
- Successful: ${stats.successfulOperations}
- Failed: ${stats.failedOperations}
- Average Duration: ${stats.averageDuration.toFixed(2)}ms
- Slow Operations: ${stats.slowOperations}
- Operation Types: ${JSON.stringify(stats.operationTypes, null, 2)}
${slowOps.length > 0 ? `- Slowest Operations:\n${slowOps.slice(0, 5).map(op => `  ${op.operationType} for ${op.layerId}: ${op.duration?.toFixed(2)}ms`).join('\n')}` : ''}
    `.trim();
  }
} 